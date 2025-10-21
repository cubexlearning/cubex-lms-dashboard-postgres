import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a super admin user
  const hashedPassword = await bcrypt.hash('Acadeno@123', 10)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'acadeno360@gmail.com' },
    update: {
      status: 'ACTIVE' as const,
    },
    create: {
      email: 'acadeno360@gmail.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE' as const,
    },
  })

  console.log('Super admin created:', superAdmin)

  // Create comprehensive institution settings
  const institutionSettings = await prisma.institutionSettings.upsert({
    where: { id: 'default-institution' },
    update: {},
    create: {
      id: 'default-institution',
      
      // Institution Information
      institutionName: 'Acadeno LMS',
      institutionLogo: '/placeholder-logo.png',
      institutionWebsite: 'https://acadeno.com',
      contactEmail: 'admin@acadeno.com',
      contactPhone: '+91-9876543210',
      address: '123 Education Street, Learning City, LC 12345',
      registrationNumber: 'EDU-REG-2024-001',
      
      // Regional & Localization
      primaryCurrency: 'INR',
      country: 'IN',
      defaultTimezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'IN',
      language: 'en',
      
      // Academic Settings
      academicYearStructure: 'SEMESTER',
      gradingSystem: 'PERCENTAGE',
      ageGroups: ['5-8', '9-12', '13-16', '17-20', '21+'],
      qualificationLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      
      // Business Settings
      paymentMethods: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'BANK_TRANSFER'],
      taxRate: 0.18, // 18% GST
      taxInclusive: true,
      refundPolicyDays: 7,
      minimumCoursePrice: 500.00,
      maximumCoursePrice: 50000.00,
      
      // System Settings
      defaultSessionDuration: 60, // 60 minutes
      maxGroupSize: 15,
      minGroupSize: 5,
      bookingLeadTimeHours: 12,
      cancellationNoticeHours: 4,
      
      // Communication Settings
      emailFromName: 'Acadeno LMS',
      emailFromAddress: 'noreply@acadeno.com',
      brandPrimaryColor: '#3B82F6', // Blue
      brandSecondaryColor: '#10B981', // Green
      
      isActive: true,
    },
  })

  console.log('Institution settings created:', institutionSettings)

  // Create sample categories
  const categories = [
    { name: 'App Development', slug: 'app-development', description: 'Mobile and web application development courses' },
    { name: 'Web Development', slug: 'web-development', description: 'Frontend and backend web development courses' },
    { name: 'Data Science', slug: 'data-science', description: 'Data analysis, machine learning, and statistical modeling courses' },
    { name: 'Data Analysis', slug: 'data-analysis', description: 'Data processing, visualization, and business intelligence courses' },
    { name: 'Cyber Security', slug: 'cyber-security', description: 'Information security, ethical hacking, and network protection courses' },
    { name: 'Digital Marketing', slug: 'digital-marketing', description: 'Online marketing, SEO, social media, and advertising courses' },
    { name: 'Robotics', slug: 'robotics', description: 'Robotic systems, automation, and engineering courses' },
    { name: 'AI', slug: 'ai', description: 'Artificial intelligence, machine learning, and automation courses' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('Categories created successfully')

  // Create sample course types
  const courseTypes = [
    { name: 'Online', slug: 'online', description: 'Online courses' },
    { name: 'Offline', slug: 'offline', description: 'In-person courses' },
    { name: 'Hybrid', slug: 'hybrid', description: 'Mixed online and offline courses' },
  ]

  for (const courseType of courseTypes) {
    await prisma.courseType.upsert({
      where: { slug: courseType.slug },
      update: {},
      create: courseType,
    })
  }

  console.log('Course types created successfully')

  // Create sample course formats
  const courseFormats = [
    { name: 'One-to-One', slug: 'one-to-one', description: 'Individual tutoring sessions' },
    { name: 'Group', slug: 'group', description: 'Group learning sessions' },
    { name: 'Workshop', slug: 'workshop', description: 'Intensive workshop sessions' },
  ]

  for (const courseFormat of courseFormats) {
    await prisma.courseFormatModel.upsert({
      where: { slug: courseFormat.slug },
      update: {},
      create: courseFormat,
    })
  }

  console.log('Course formats created successfully')

  // Create sample curriculum
  const curriculum = await prisma.curriculum.upsert({
    where: { 
      name_type_level: {
        name: 'Web Development with AI',
        type: 'ACADEMIC',
        level: 'FOUNDATION' as const
      }
    },
    update: {},
    create: {
      name: 'Web Development with AI',
      type: 'ACADEMIC',
      level: 'FOUNDATION' as const,
      description: 'Comprehensive learning curriculum for all subjects',
    },
  })

  console.log('Curriculum created:', curriculum)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })