import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { VisitorOCRData, GPTVisionResponse } from '@/types';
import { ObjectId } from 'mongodb';

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
`;


export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("llmorc");

    const visitors = await db.collection('visitors')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { message: 'Failed to fetch visitors' },
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
        console.error('Image processing failed:', error);
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
      result = await db.collection('visitors').insertOne(visitor);
    }

    return NextResponse.json({ 
      message: 'Visitor saved successfully',
      visitor: result
    });
  } catch (error) {
    console.error('Error creating visitor:', error);
    return NextResponse.json(
      { message: 'Failed to create visitor' },
      { status: 500 }
    );
  }
}


async function processImageWithGPTVision(imageUrl: string): Promise<VisitorOCRData | null> {
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
    throw new Error(`GPT Vision API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data: GPTVisionResponse = await response.json();
  return extractJSON(data.choices[0]?.message?.content);
}

function extractJSON(message: string | undefined): VisitorOCRData | null {
  if (!message) return null;

  try {
    const jsonString = message
      .replace(/```json\n?/, '')  // Remove starting ```json and optional newline
      .replace(/\n?```/, '')      // Remove ending ``` and optional newline
      .trim();
    
    const parsed = JSON.parse(jsonString);
    
    // Validate required fields
    if (!parsed.identification || !parsed.firstname || !parsed.surname || !parsed.birthDate) {
      console.warn('Parsed JSON missing required fields:', parsed);
      return null;
    }

    return parsed as VisitorOCRData;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}
