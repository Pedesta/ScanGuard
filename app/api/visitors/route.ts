import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { VisitorOCRData, GPTVisionResponse } from '@/types';
import { ObjectId } from 'mongodb';

const invalidId = "Not a valid id card";
interface Query {
  createdAt?: {
    $gte: Date;
    $lte: Date;
  };
}

const PROMPT = `
Extract information as json only from this image. 
Return json with: 
- identification
- firstname
- surname
- birthDate (as mm/dd/yyyy)
- gender? (Male, Female, Unknown - if available: 
  - Note that the last letter in the identification, if available, represents gender).

Match fields appropriately even if names differ slightly.

If the image does not contain the text 'REGISTRATION' then simply respond with "${invalidId}" only!!!
If the image does not contain the text 'REGISTRATION' then simply respond with "${invalidId}" only!!!
If the image does not contain the text 'REGISTRATION' then simply respond with "${invalidId}" only!!!
`;

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("llmorc");

    // Extract query parameters from the URL
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // Build the query
    const query: Query = {};

    // Add date range filter if both start and end dates are provided
    if (start && end) {
      query.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const visitors = await db.collection('visitors')
      .find(query, { projection: { image: 0, ocrMessage: 0, ocrSuccess: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(visitors);
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch visitors', error: `${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const visitorData = await request.json();
    const client = await clientPromise;
    const db = client.db("llmorc");

    // Create visitor with timestamps
    const dtNow = new Date();
    let visitor = {
      ...visitorData,
      checkout: '',
      createdAt: dtNow,
      updatedAt: dtNow,
    };

    if (!visitor._id) {
      visitor = {
        ...visitor,
        checkin: dtNow,
      }
    }

    // Process image if it exists
    if (visitor.image && !visitor._id) {
      try {
        const ocrData = await processImageWithGPTVision(visitor.image);
        if (ocrData) {
          visitor = {
            ...visitor,
            ...ocrData
          };
        }
      } catch (error) {
        return NextResponse.json(
          { message: `${error}` }, 
          { status: 500 }
        );
      }
    }

    let result = null;

    // Insert or update based on the presence of _id
    if (visitor._id) {
      const { _id, ...updateData } = visitor;
      const objectId = new ObjectId(_id);
      result = await db.collection('visitors').updateOne(
        { _id: objectId },
        { 
          $set: { 
            ...updateData,
            updatedAt: new Date()  // Ensure timestamp is updated on modification
          }
        }
      );
    } else {
      // First find by identifier
      const exists = await db.collection('visitors')
      .find({ 
        identification: visitor.identification, 
        checkout: ''
      }, { projection: { image: 0} }).toArray();
      if(exists?.length > 0) {
        return NextResponse.json(
          { message: 'A visitor with same ID is still checked in. Entry Aborted!' },
          { status: 500 }
        );
      }

      const _result = await db.collection('visitors').insertOne(visitor);
      result = await db.collection('visitors')
      .findOne({_id: _result.insertedId })
    }

    return NextResponse.json({ 
      message: 'Visitor saved successfully',
      visitor: result
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create visitor', error: `${error}` },
      { status: 500 }
    );
  }
}


async function processImageWithGPTVision(imageUrl: string): Promise<VisitorOCRData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.error?.message || 'GPT Vision error'}`);
  }

  const data: GPTVisionResponse = await response.json();
  return extractJSON(data.choices[0]?.message?.content);
}

function extractJSON(message: string): VisitorOCRData {
  try {
    const jsonString = message
      .replace(/```json\n?/, '')  // Remove starting ```json and optional newline
      .replace(/\n?```/, '')      // Remove ending ``` and optional newline
      .trim();
    
    if(jsonString.includes(invalidId)) {
      throw new Error(jsonString);
    }
    const parsed = JSON.parse(jsonString);
    
    // Validate required fields
    if (!parsed.identification || !parsed.firstname || !parsed.surname || !parsed.birthDate) {
      throw new Error("Parsed data does not contain all required fileds.");
    }

    return parsed as VisitorOCRData;
  } catch (error) {
    throw new Error(`${error}`);
  }
}
