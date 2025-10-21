export function createButton(text: string, url: string, style?: string, brandColor?: string): string {
  const defaultStyle = `display: inline-block; padding: 12px 24px; background-color: ${brandColor || '#3B82F6'}; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;`
  return `<a href="${url}" style="${style || defaultStyle}">${text}</a>`
}

export function createInfoBox(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
  const colors = {
    info: '#d1ecf1',
    success: '#d4edda',
    warning: '#fff3cd',
    error: '#f8d7da'
  }
  
  return `
    <div style="background-color: ${colors[type]}; border: 1px solid ${colors[type]}; border-radius: 5px; padding: 15px; margin: 20px 0;">
      ${content}
    </div>
  `
}

export function createCredentialsBox(credentials: { label: string; value: string }[]): string {
  return `
    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #495057;">Login Credentials</h3>
      ${credentials.map(cred => `
        <div style="margin-bottom: 10px;">
          <strong>${cred.label}:</strong>
          <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 3px; margin-left: 10px;">${cred.value}</code>
        </div>
      `).join('')}
    </div>
  `
}
