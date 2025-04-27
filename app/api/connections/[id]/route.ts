import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    params = await params
    const connectionId = parseInt(params.id);
    
    // Get connection
    const connectionResult = await db.execute(
      sql`SELECT * FROM connections WHERE id = ${connectionId}`
    );
    
    // Transform the result to a serializable array
    const connections = Array.isArray(connectionResult) ? connectionResult : [];
    
    if (connections.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Process the connection to be serializable
    const connection = connections[0];
    const plainObject: Record<string, any> = {};
    for (const key in connection) {
      let value = connection[key];
      // Convert dates to ISO strings
      if (value instanceof Date) {
        value = value.toISOString();
      }
      plainObject[key] = value;
    }
    
    return NextResponse.json(plainObject);
  } catch (error) {
    console.error('Connection fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const connectionId = parseInt(params.id);
    
    // Ensure the user is authorized to delete this connection
    // For simplicity, we'll just verify they own the connection
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const connectionResult = await db.execute(
      sql`SELECT * FROM connections WHERE id = ${connectionId} AND user_id = ${userIdNum}`
    );
    
    const connections = Array.isArray(connectionResult) ? connectionResult : [];
    
    if (connections.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    // Delete the connection
    await db.execute(
      sql`DELETE FROM connections WHERE id = ${connectionId} AND user_id = ${userIdNum}`
    );
    
    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    console.error('Connection deletion error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const connectionId = parseInt(params.id);
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Connection name is required' },
        { status: 400 }
      );
    }
    
    // Ensure the user is authorized to update this connection
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    const connectionResult = await db.execute(
      sql`SELECT * FROM connections WHERE id = ${connectionId} AND user_id = ${userIdNum}`
    );
    
    const connections = Array.isArray(connectionResult) ? connectionResult : [];
    
    if (connections.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Get existing connection to merge configs
    const existingConnection = connections[0];
    const existingConfig = existingConnection.config || {};
    
    // Create updated connection configuration
    const config = {
      ...existingConfig,
      type: body.type || existingConfig.type || 'sql',
      hostname: body.hostname || existingConfig.hostname,
      port: body.port || existingConfig.port,
      database: body.database || existingConfig.database,
      username: body.username || existingConfig.username,
      // Don't overwrite password if not provided
      password: body.password ?? existingConfig.password,
      sslMode: body.sslMode || existingConfig.sslMode,
      baseUrl: body.baseUrl || existingConfig.baseUrl,
      authType: body.authType || existingConfig.authType,
      // Don't overwrite API key if not provided
      apiKey: body.apiKey ?? existingConfig.apiKey,
      headerName: body.headerName || existingConfig.headerName,
      delimiter: body.delimiter || existingConfig.delimiter,
      encoding: body.encoding || existingConfig.encoding,
      hasHeaderRow: body.hasHeaderRow !== undefined ? body.hasHeaderRow : existingConfig.hasHeaderRow
    };
    
    const spaceIdNum = body.spaceId ? parseInt(body.spaceId) : existingConnection.space_id;
    const configJson = JSON.stringify(config);
    
    // Update the connection
    await db.execute(sql`
      UPDATE connections 
      SET 
        name = ${body.name},
        type = ${body.type || existingConnection.type},
        space_id = ${spaceIdNum},
        config = ${configJson}::jsonb,
        updated_at = NOW()
      WHERE 
        id = ${connectionId} AND user_id = ${userIdNum}
    `);
    
    // Get updated connection
    const updatedConnection = await db.execute(sql`
      SELECT * FROM connections WHERE id = ${connectionId}
    `);
    
    // Serialize the connection for the response
    let connection = null;
    if (Array.isArray(updatedConnection) && updatedConnection.length > 0) {
      const conn = updatedConnection[0];
      connection = {} as Record<string, any>;
      
      // Create a serializable object from the row
      for (const key in conn) {
        let value = conn[key];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        connection[key] = value;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection updated successfully',
      connection
    });
  } catch (error) {
    console.error('Connection update error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}