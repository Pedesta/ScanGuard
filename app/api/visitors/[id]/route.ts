import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { calculateStay } from '@/utils'
import { ObjectId } from 'mongodb';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("llmorc");
    const { id } = params;

    const dtNow = new Date();
     // Convert string ID to MongoDB ObjectId
     let objectId;
     try {
       objectId = new ObjectId(id);
     } catch{
       return NextResponse.json(
         { message: 'Invalid visitor ID format' },
         { status: 400 }
       );
     }

    const visitor = await db.collection('visitors').findOne({ _id: objectId });

    if (!visitor) {
      throw new Error(`Visitor not found - id: ${objectId.toString()}`);
    }

    const checkin = visitor.checkin;
    const stay = calculateStay(checkin, dtNow);

    const result = await db.collection('visitors').updateOne(
      { _id: objectId },
      { $set: { checkout: dtNow, stay, updatedAt: dtNow } }
    );

    if (result.modifiedCount === 0) {
      throw new Error('Visitor not found or already checked out');
    }

    const updatedVisitor = await db.collection('visitors').findOne({ _id: objectId });

    return NextResponse.json({ 
      message: 'Visitor checked out successfully',
      visitor: updatedVisitor
    });
  } catch (error) {
    console.error('Error checking out visitor:', error);
    return NextResponse.json(
      { message: 'Failed to check out visitor' },
      { status: 500 }
    );
  }
}