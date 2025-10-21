export interface EmailLayoutProps {
  title: string
  content: string
  institutionName: string
  institutionLogo?: string
  footerText?: string
  brandPrimaryColor?: string
  brandSecondaryColor?: string
  contactEmail?: string
  website?: string
}

export function createEmailLayout({ 
  title, 
  content, 
  institutionName, 
  institutionLogo, 
  footerText, 
  brandPrimaryColor = '#3B82F6', 
  brandSecondaryColor = '#10B981',
  contactEmail,
  website
}: EmailLayoutProps): string {
  // Convert relative logo path to absolute URL
  const getAbsoluteLogoUrl = (logoPath: string | undefined): string | undefined => {
    if (!logoPath) return undefined
    
    // If it's already an absolute URL, return as is
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath
    }
    
    // If it's a relative path, convert to absolute URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return logoPath.startsWith('/') ? `${baseUrl}${logoPath}` : `${baseUrl}/${logoPath}`
  }

  const absoluteLogoUrl = getAbsoluteLogoUrl(institutionLogo)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${brandPrimaryColor} 0%, ${brandSecondaryColor} 100%); padding: 30px; text-align: center;">
          ${absoluteLogoUrl ? `<img src="${absoluteLogoUrl}" alt="${institutionName}" style="max-height: 50px; border-radius: 4px;" onerror="this.style.display='none';">` : ''}
          <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">${institutionName}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            ${footerText || `© ${new Date().getFullYear()} ${institutionName}. All rights reserved.`}
          </p>
          <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
            ${contactEmail ? `For support, contact us at ${contactEmail}` : 'This email was sent from a notification-only address. Please do not reply.'}
            ${website ? ` | Visit us at ${website}` : ''}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
