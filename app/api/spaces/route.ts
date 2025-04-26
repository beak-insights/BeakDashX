import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { spaces, userSpaces, users } from '@/lib/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const allSpaces = await db.query.spaces.findMany({
      orderBy: (spaces, { asc }) => [asc(spaces.name)],
    });
    
    return NextResponse.json(allSpaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let name: string;
    let description: string | null = null;
    let isDefault = false;
    
    // Check content type to determine how to parse the data
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Handle JSON data
      const jsonData = await request.json();
      name = jsonData.name;
      description = jsonData.description || null;
      isDefault = jsonData.isDefault || false;
    } else {
      // Handle form data
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string | null;
      isDefault = formData.get('isDefault') === 'on';
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Space name is required' }, { status: 400 });
    }
    
    // If this space is to be the default, update all existing spaces to not be default
    if (isDefault) {
      await db.update(spaces)
        .set({ isDefault: false })
        .where(eq(spaces.isDefault, true));
    }
    
    // Create a slug from the name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    // Find the current user
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email || ''),
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Insert the new space
    const [newSpace] = await db.insert(spaces)
      .values({
        name,
        description,
        slug,
        isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Add creator as owner of the space
    await db.insert(userSpaces).values({
      userId: user.id,
      spaceId: newSpace.id,
      role: 'owner',
      joinedAt: new Date(),
    });
    
    // Return JSON response for API calls, redirect for form submissions
    if (contentType?.includes('application/json')) {
      return NextResponse.json(newSpace);
    } else {
      return NextResponse.redirect(new URL('/spaces', request.url));
    }
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
  }
}