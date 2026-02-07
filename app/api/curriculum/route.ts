export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// GET /api/curriculum - List all curricula with pagination
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search') || ''
    
    // First, let's create some default curricula if none exist
    const existingCurricula = await prisma.curriculum.findMany()
    
    if (existingCurricula.length === 0) {
      // Create default curricula
      const defaultCurricula = [
        {
          name: "GCSE Mathematics",
          type: "BRITISH" as const,
          level: "GCSE" as const,
          description: "General Certificate of Secondary Education Mathematics"
        },
        {
          name: "A-Level Physics",
          type: "BRITISH" as const,
          level: "A_LEVEL" as const, 
          description: "Advanced Level Physics for university preparation"
        },
        {
          name: "National 5 English",
          type: "SCOTTISH" as const,
          level: "NATIONAL_5" as const,
          description: "Scottish National 5 English qualification"
        },
        {
          name: "Higher Mathematics",
          type: "SCOTTISH" as const,
          level: "HIGHER" as const,
          description: "Scottish Higher Mathematics qualification"
        }
      ]

      for (const curriculum of defaultCurricula) {
        try {
          await prisma.curriculum.create({
            data: curriculum
          })
        } catch (error) {
          // Ignore if already exists
          console.log(`Curriculum ${curriculum.name} already exists`)
        }
      }
    }

    // Build where clause
    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { level: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.curriculum.count({ where })

    // Get paginated data
    const curricula = await prisma.curriculum.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: curricula,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching curricula:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch curricula' },
      { status: 500 }
    )
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  level: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = createSchema.parse(body)
    const created = await prisma.curriculum.create({ data: { ...parsed, isActive: parsed.isActive ?? true } })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.flatten() }, { status: 400 })
    return NextResponse.json({ success: false, error: 'Failed to create curriculum' }, { status: 500 })
  }
}
