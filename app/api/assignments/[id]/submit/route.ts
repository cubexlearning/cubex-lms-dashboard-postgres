import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadImages, uploadVideos, uploadGeneralFiles, generateUniqueFilename } from '@/lib/blob'

export const runtime = 'nodejs'

// POST /api/assignments/[id]/submit - Submit assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id: assignmentId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: session.user.id,
        courseId: assignment.courseId,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id
        }
      }
    })

    if (existingSubmission && existingSubmission.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Assignment already submitted' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const submissionType = formData.get('submissionType') as string
    const content = formData.get('content') as string
    const description = formData.get('description') as string

    let attachments = null

    try {
      // Handle different submission types
      switch (submissionType) {
        case 'SCREENSHOTS': {
          const imageFiles = formData.getAll('images') as File[]
          if (imageFiles.length === 0) {
            return NextResponse.json(
              { success: false, error: 'No images provided' },
              { status: 400 }
            )
          }

          const imageResults = await uploadImages(imageFiles)
          attachments = {
            type: 'SCREENSHOTS',
            data: {
              images: imageResults.map(result => ({
                url: result.url,
                filename: result.pathname,
                size: result.size,
                contentType: result.contentType
              })),
              description,
              uploadedAt: new Date().toISOString()
            }
          }
          break
        }

        case 'SCREENRECORDINGS': {
          const videoFiles = formData.getAll('videos') as File[]
          if (videoFiles.length === 0) {
            return NextResponse.json(
              { success: false, error: 'No videos provided' },
              { status: 400 }
            )
          }

          const videoResults = await uploadVideos(videoFiles)
          attachments = {
            type: 'SCREENRECORDINGS',
            data: {
              videos: videoResults.map(result => ({
                url: result.url,
                filename: result.pathname,
                size: result.size,
                contentType: result.contentType
              })),
              description,
              uploadedAt: new Date().toISOString()
            }
          }
          break
        }

        case 'FILE_UPLOAD': {
          const files = formData.getAll('files') as File[]
          if (files.length === 0) {
            return NextResponse.json(
              { success: false, error: 'No files provided' },
              { status: 400 }
            )
          }

          const fileResults = await uploadGeneralFiles(files)
          attachments = {
            type: 'FILE_UPLOAD',
            data: {
              files: fileResults.map(result => ({
                name: result.pathname.split('/').pop(),
                url: result.url,
                filename: result.pathname,
                size: result.size,
                contentType: result.contentType
              })),
              description,
              uploadedAt: new Date().toISOString()
            }
          }
          break
        }

        case 'GITHUB_URL': {
          const repositoryUrl = formData.get('repositoryUrl') as string
          const branch = formData.get('branch') as string
          const commitHash = formData.get('commitHash') as string
          
          if (!repositoryUrl) {
            return NextResponse.json(
              { success: false, error: 'Repository URL is required' },
              { status: 400 }
            )
          }

          attachments = {
            type: 'GITHUB_URL',
            data: {
              repositoryUrl,
              branch: branch || 'main',
              commitHash,
              description
            }
          }
          break
        }

        case 'LIVE_URL': {
          const url = formData.get('url') as string
          const technologies = formData.get('technologies') as string
          
          if (!url) {
            return NextResponse.json(
              { success: false, error: 'Live URL is required' },
              { status: 400 }
            )
          }

          attachments = {
            type: 'LIVE_URL',
            data: {
              url,
              technologies: technologies ? JSON.parse(technologies) : [],
              description
            }
          }
          break
        }

        case 'MULTIPLE_TYPES': {
          const githubUrl = formData.get('githubUrl') as string
          const liveUrl = formData.get('liveUrl') as string
          const screenshotFiles = formData.getAll('screenshots') as File[]
          const fileUploads = formData.getAll('fileUploads') as File[]
          
          let screenshotUrls = []
          let uploadedFiles = []

          if (screenshotFiles.length > 0) {
            const screenshotResults = await uploadImages(screenshotFiles)
            screenshotUrls = screenshotResults.map(result => ({
              url: result.url,
              filename: result.pathname,
              size: result.size,
              contentType: result.contentType
            }))
          }

          if (fileUploads.length > 0) {
            const fileResults = await uploadGeneralFiles(fileUploads)
            uploadedFiles = fileResults.map(result => ({
              name: result.pathname.split('/').pop(),
              url: result.url,
              filename: result.pathname,
              size: result.size,
              contentType: result.contentType
            }))
          }
          
          attachments = {
            type: 'MULTIPLE_TYPES',
            data: {
              githubUrl: githubUrl || null,
              liveUrl: liveUrl || null,
              screenshots: screenshotUrls,
              files: uploadedFiles,
              description
            }
          }
          break
        }

        default: {
          // TEXT submission
          attachments = {
            type: 'TEXT',
            data: {
              content,
              description
            }
          }
          break
        }
      }

      // Determine if submission is late
      const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false
      const status = isLate ? 'LATE' : 'SUBMITTED'

      // Create or update submission
      const submission = await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: session.user.id
          }
        },
        update: {
          content,
          submissionType: submissionType as any,
          attachments,
          status: status as any,
          submittedAt: new Date()
        },
        create: {
          assignmentId,
          studentId: session.user.id,
          enrollmentId: enrollment.id,
          content,
          submissionType: submissionType as any,
          attachments,
          status: status as any
        }
      })

      return NextResponse.json({
        success: true,
        data: submission,
        message: `Assignment submitted successfully${isLate ? ' (Late submission)' : ''}`
      })

    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Assignment submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
