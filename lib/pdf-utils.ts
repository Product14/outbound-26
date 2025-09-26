import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Type declaration for jsPDF with autoTable extension
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    getNumberOfPages: () => number
  }
}

// Import jspdf-autotable using ES6 import
let autoTableInitialized = false

const initAutoTable = async () => {
  if (!autoTableInitialized) {
    try {
      // Dynamic import for Next.js compatibility
      const autoTable = await import('jspdf-autotable')
      // The import automatically extends jsPDF prototype
      autoTableInitialized = true
      console.log('AutoTable module loaded successfully')
    } catch (error) {
      console.error('Failed to load jspdf-autotable:', error)
      throw new Error('PDF table library failed to load')
    }
  }
}

// Duration formatting function (same logic as CSV)
function formatDurationForPDF(duration: any, status?: string, connectionStatus?: string, outcome?: string): string {
  if (!duration || isNaN(parseFloat(duration))) {
    return "--"
  }
  
  const durationValue = parseFloat(duration)
  const minutes = Math.floor(durationValue / 60)
  const seconds = Math.round(durationValue % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Outcome text formatting function (same logic as CSV)
function formatOutcomeTextForPDF(outcome: string): string {
  if (!outcome || outcome === '--' || outcome.trim() === '') {
    return '--'
  }
  
  // Convert to proper case and clean up
  return outcome
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Define interface for campaign data used in PDF
interface CampaignCallRecord {
  id: string
  customer: {
    name: string
    phone: string
  }
  status: string
  outcome: string
  duration: string
  callDate: string
  callTime: string
  timestamp: string
  agent: {
    name: string
  }
  qualityScore: number | string
  retryCount: number
}

interface PDFOptions {
  filename?: string
  quality?: number
  scale?: number
  includeAllPages?: boolean
  showErrorToasts?: boolean
}

/**
 * Downloads all campaign data as a beautiful PDF report using UI screenshots
 * @param campaignId - The campaign ID
 * @param authKey - Authentication key
 * @param options - PDF generation options
 */
export async function downloadCampaignPDF(
  campaignId: string,
  authKey?: string,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = `campaign-report-${new Date().toISOString().split('T')[0]}.pdf`,
    showErrorToasts = true
  } = options

  // Show loading indicator
  const loadingToast = showLoadingToast('Generating PDF report...')

  try {
    console.log('🔄 Starting screenshot-based PDF generation for campaign:', campaignId)

    // Find the table container
    const tableContainer = document.querySelector('[data-campaign-container]') as HTMLElement
    if (!tableContainer) {
      throw new Error('Campaign table not found. Please make sure you are on a campaign details page.')
    }

    // Generate PDF using fast data-based approach
    await generateFastDataBasedPDF(campaignId, filename, authKey)

    // Hide loading indicator
    hideLoadingToast(loadingToast)
    
    // Show success message
    showSuccessToast(`Fast PDF report generated successfully!`)

  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Hide loading toast
    hideLoadingToast(loadingToast)
    
    // Only show error toast if enabled
    if (showErrorToasts) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.'
      showErrorToast(errorMessage)
    }
    
    throw error
  }
}

/**
 * Legacy function - Captures a screenshot of the campaign data and generates a PDF
 * @param campaignId - The campaign ID for filename
 * @param options - PDF generation options
 */
export async function downloadCampaignScreenshotPDF(
  campaignId: string,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = `campaign-${campaignId}-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.85, // Good quality for professional output
    scale = 1.8, // Higher scale for better readability
    includeAllPages = true // Enable multi-page for better UI
  } = options

  try {
    // Show loading indicator
    const loadingToast = showLoadingToast('Generating PDF...')

    // Find the main campaign container
    const campaignContainer = document.querySelector('[data-campaign-container]') as HTMLElement
    if (!campaignContainer) {
      throw new Error('Campaign container not found. Please make sure you are on a campaign details page.')
    }

    // Use multi-page capture for better UI and complete data
    await captureMultiPagePDF(campaignContainer, filename, { quality, scale })

    // Hide loading indicator
    hideLoadingToast(loadingToast)
    
    // Show success message
    showSuccessToast('PDF downloaded successfully!')

  } catch (error) {
    console.error('Error generating PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.'
    showErrorToast(errorMessage)
    throw error
  }
}

/**
 * Generates PDF from current UI screenshot (what user sees)
 */
async function generateScreenshotBasedPDF(
  campaignId: string,
  tableContainer: HTMLElement,
  filename: string,
  authKey?: string
): Promise<void> {
  console.log('📊 Starting screenshot-based PDF generation for current view')

  try {
    // Wait a moment for any pending UI updates
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get current page info for the header
    const currentPage = getCurrentPageNumber()
    const currentPageSize = getCurrentPageSize()
    const totalRecordsElement = document.querySelector('[data-total-records]')
    const totalRecords = totalRecordsElement ? totalRecordsElement.textContent : 'Unknown'
    
    console.log('📋 Capturing current view:', {
      currentPage,
      currentPageSize,
      totalRecords
    })
    
    // Capture screenshot of the current table view
    const canvas = await html2canvas(tableContainer, {
      scale: 2, // High quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: tableContainer.offsetWidth,
      height: tableContainer.offsetHeight,
      removeContainer: false
    })

    console.log('📸 Screenshot captured, generating PDF...')

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')

    // Add header
    pdf.setFontSize(18)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Campaign Report', 20, 20)
    
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Campaign ID: ${campaignId}`, 20, 30)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 38)
    pdf.text(`Page ${currentPage} • ${totalRecords} total records`, 20, 46)

    // Add screenshot
    const imgData = canvas.toDataURL('image/jpeg', 0.9)
    const imgWidth = 170 // A4 width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const maxHeight = 230 // Max height to fit on page with header/footer
    const finalHeight = Math.min(imgHeight, maxHeight)

    pdf.addImage(
      imgData, 
      'JPEG', 
      20, 
      55, // Start below header
      imgWidth, 
      finalHeight
    )

    // Add footer
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Generated by Campaign Management System • ${new Date().toLocaleDateString()}`, 20, 285)

    console.log('💾 Saving PDF...')
    
    // Save PDF
    pdf.save(filename)
    
    console.log('✅ PDF saved successfully!')

  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    throw error
  }
}

// Helper functions for getting current page info
function getCurrentPageSize(): number {
  const pageSizeElement = document.querySelector('[data-page-size]') as HTMLElement
  return pageSizeElement ? parseInt(pageSizeElement.textContent || '10') : 10
}

function getCurrentPageNumber(): number {
  const currentPageElement = document.querySelector('[data-current-page]') as HTMLElement
  return currentPageElement ? parseInt(currentPageElement.textContent || '1') : 1
}

/**
 * Fast data-based PDF generation - fetches all data and creates PDF table directly
 */
async function generateFastDataBasedPDF(
  campaignId: string,
  filename: string,
  authKey?: string
): Promise<void> {
  console.log('🚀 Starting FAST data-based PDF generation...')
  
  try {
    // Initialize jsPDF with autoTable
    await initAutoTable()
    
    // Fetch all campaign data
    console.log('📡 Fetching all campaign data...')
    const allRecords = await fetchAllCampaignDataForPDF(campaignId, authKey)
    
    if (allRecords.length === 0) {
      throw new Error('No data found for the campaign')
    }
    
    console.log(`📋 Retrieved ${allRecords.length} records, generating PDF...`)
    
    // Generate PDF with proper pagination (10 records per page)
    await createDataBasedPDF(allRecords, campaignId, filename)
    
    console.log('✅ Fast PDF generation completed!')
    
  } catch (error) {
    console.error('❌ Error in fast PDF generation:', error)
    throw error
  }
}

/**
 * Creates PDF with data table and proper pagination
 */
async function createDataBasedPDF(
  records: CampaignCallRecord[],
  campaignId: string,
  filename: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // PDF styling
  const primaryColor: [number, number, number] = [34, 197, 94] // Green
  const secondaryColor: [number, number, number] = [107, 114, 128] // Gray
  const successColor: [number, number, number] = [34, 197, 94] // Green
  const warningColor: [number, number, number] = [251, 191, 36] // Yellow
  const errorColor: [number, number, number] = [239, 68, 68] // Red
  
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  
  // Add header to first page
  pdf.setFontSize(20)
  pdf.setTextColor(...primaryColor)
  pdf.text('Campaign Report', margin, 25)
  
  pdf.setFontSize(12)
  pdf.setTextColor(...secondaryColor)
  pdf.text(`Campaign ID: ${campaignId}`, margin, 35)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 42)
  pdf.text(`Total Records: ${records.length}`, margin, 49)
  
  // Prepare table data
  const tableHeaders = [
    'Customer Name',
    'Phone',
    'Status', 
    'Timestamp',
    'Duration',
    'Outcome',
    'Agent',
    'Quality Score'
  ]
  
  const tableData = records.map(record => [
    record.customer.name || '--',
    record.customer.phone || '--',
    record.status || '--',
    `${record.callDate} ${record.callTime}`,
    record.duration || '--',
    formatOutcomeTextForPDF(record.outcome),
    record.agent.name || '--',
    typeof record.qualityScore === 'number' ? record.qualityScore.toString() : '--'
  ])
  
  // Generate table with autoTable
  pdf.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 60,
    margin: { left: margin, right: margin },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Light gray
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Customer Name
      1: { cellWidth: 22 }, // Phone  
      2: { cellWidth: 20 }, // Status
      3: { cellWidth: 25 }, // Timestamp
      4: { cellWidth: 15 }, // Duration
      5: { cellWidth: 25 }, // Outcome
      6: { cellWidth: 20 }, // Agent
      7: { cellWidth: 15 }  // Quality Score
    },
    didDrawCell: function(data: any) {
      // Color code status cells
      if (data.column.index === 2) { // Status column
        const status = data.cell.text[0]?.toLowerCase() || ''
        if (status.includes('completed')) {
          pdf.setFillColor(...successColor)
        } else if (status.includes('failed') || status.includes('error')) {
          pdf.setFillColor(...errorColor)
        } else if (status.includes('queue') || status.includes('live')) {
          pdf.setFillColor(...warningColor)
        }
      }
      
      // Color code quality scores
      if (data.column.index === 7) { // Quality Score column
        const score = parseInt(data.cell.text[0] || '0')
        if (score >= 8) {
          pdf.setTextColor(...successColor)
        } else if (score >= 6) {
          pdf.setTextColor(...warningColor)
        } else if (score > 0) {
          pdf.setTextColor(...errorColor)
        }
      }
    },
    didDrawPage: function(data: any) {
      // Add page footer with pagination info
      const pageCount = pdf.getNumberOfPages ? pdf.getNumberOfPages() : data.pageNumber || 1
      
      pdf.setFontSize(8)
      pdf.setTextColor(...secondaryColor)
      pdf.text(
        `Page ${data.pageNumber || pageCount}`,
        pageWidth - margin - 30,
        pageHeight - 10
      )
      
      pdf.text(
        `Generated by Campaign Management System • ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - 10
      )
    }
  })

  // Save the PDF
  pdf.save(filename)
}

/**
 * Fetches all campaign data for PDF generation (similar to CSV export)
 */
async function fetchAllCampaignDataForPDF(
  campaignId: string,
  authKey?: string
): Promise<CampaignCallRecord[]> {
  const allRecords: CampaignCallRecord[] = []
  let currentPage = 1
  let hasMoreData = true
  const itemsPerPage = 10
  let consecutiveEmptyPages = 0
  const maxRetries = 3
  let retryCount = 0

  console.log(`📡 Starting data fetch for PDF generation: ${campaignId}`)

  while (hasMoreData) {
    try {
      console.log(`📄 Fetching page ${currentPage} for PDF...`)
      
      // Build API URL (same as CSV export)
      const params = new URLSearchParams({
        campaignId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        showCallbacks: 'false'
      })

      if (authKey) {
        params.append('auth_key', authKey)
      }

      const apiUrl = `/api/fetch-campaign-status?${params.toString()}`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        
        if (response.status === 404) {
          throw new Error('Campaign not found. Please check the campaign ID.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Please check your permissions.')
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
      }

      const data = await response.json()
      
      // Check if we have tasks data
      if (data.tasks && Array.isArray(data.tasks)) {
        const pageRecords = data.tasks.map((task: any) => {
          // Parse date and time from statusUpdatedAt (same logic as in live-activity-table.tsx)
          const updatedDate = new Date(task.statusUpdatedAt)
          const dateStr = updatedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
          const timeStr = updatedDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })

          // Format duration using the same logic as the table (need to import this function)
          const durationValue = task.duration || task.callDuration
          const formattedDuration = formatDurationForPDF(durationValue, task.status, task.connectionStatus, task.outcome)

          // Quality score processing - check multiple possible fields (same as CSV)
          const aiQualityRaw = task.aiQuality
          const customerSentimentScore = task.customerSentimentScore
          const qualityScore = task.qualityScore
          
          // Check multiple status conditions (same as CSV)
          const isCompleted = task.connectionStatus === 'connected' || 
                             task.status === 'CALL_COMPLETED' ||
                             task.connectionStatus === 'CALL_COMPLETED' ||
                             task.status === 'Call Completed' ||
                             task.status?.toLowerCase().includes('completed')
          
          // Try multiple quality score fields (same as CSV)
          let qualityScoreForPDF: number | string = "--"
          
          if (isCompleted) {
            if (aiQualityRaw && !isNaN(parseFloat(aiQualityRaw))) {
              qualityScoreForPDF = parseFloat(aiQualityRaw)
            } else if (qualityScore && !isNaN(parseFloat(qualityScore))) {
              qualityScoreForPDF = parseFloat(qualityScore)
            } else if (customerSentimentScore && !isNaN(parseFloat(customerSentimentScore))) {
              qualityScoreForPDF = parseFloat(customerSentimentScore)
            }
          }

          // Agent name processing (same as CSV)
          const agentNameFromData = data.agentName
          const agentNameFromTask = task.agent?.name || task.agentName
          const finalAgentName = agentNameFromData || agentNameFromTask || 'AI Agent'

          return {
            id: task.callId || task.id || `call-${currentPage}-${Math.random()}`,
            customer: {
              name: task.leadName || task.customer?.name || task.customerName || 'Unknown',
              phone: task.phoneNumber || task.customer?.phone || task.customerPhone || 'Unknown'
            },
            status: task.status || 'Unknown',
            outcome: formatOutcomeTextForPDF(task.outcome || '--'),
            duration: formattedDuration,
            callDate: dateStr,
            callTime: timeStr,
            timestamp: task.statusUpdatedAt || task.timestamp || task.createdAt || new Date().toISOString(),
            agent: {
              name: finalAgentName
            },
            qualityScore: qualityScoreForPDF,
            retryCount: task.retryCount || 0
          }
        })

        allRecords.push(...pageRecords)
        console.log(`✅ Added ${pageRecords.length} records from page ${currentPage}. Total so far: ${allRecords.length}`)
        
        retryCount = 0

        // Check pagination
        const recordsOnThisPage = pageRecords.length
        const apiPagination = data.pagination
        const totalPages = apiPagination?.totalPages
        
        if (recordsOnThisPage === 0) {
          consecutiveEmptyPages++
        } else {
          consecutiveEmptyPages = 0
        }
        
        // Continue if we have more pages or data
        if (totalPages && currentPage < totalPages) {
          hasMoreData = true
        } else if (recordsOnThisPage > 0) {
          hasMoreData = true
        } else if (consecutiveEmptyPages < 3) {
          hasMoreData = true
        } else {
          hasMoreData = false
        }
        
        // Safety limit
        if (currentPage >= 100) {
          hasMoreData = false
        }
        
        if (hasMoreData) {
          currentPage++
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else {
        console.log(`⚠️ No tasks found in API response for page ${currentPage}`)
        hasMoreData = false
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error)
      
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`🔄 Retrying page ${currentPage} (attempt ${retryCount}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        continue
      }
      
      hasMoreData = false
      
      if (currentPage === 1) {
        throw error
      }
      
      console.warn(`⚠️ Failed to fetch page ${currentPage} after ${maxRetries} retries, continuing with ${allRecords.length} records`)
    }
  }

  console.log(`🏁 PDF Data fetch completed: ${allRecords.length} total records`)
  return allRecords
}

/**
 * Generates a beautiful data-driven PDF report
 */
async function generateDataDrivenPDF(
  data: CampaignCallRecord[],
  campaignId: string,
  filename: string
): Promise<void> {
  // Initialize autoTable plugin
  await initAutoTable()
  
  // Create PDF with landscape orientation for better table fit
  const pdf = new jsPDF('l', 'mm', 'a4')
  
  // Set up colors and fonts
  const primaryColor: [number, number, number] = [41, 98, 255] // Blue
  const secondaryColor: [number, number, number] = [107, 114, 126] // Gray
  const successColor: [number, number, number] = [34, 197, 94] // Green
  const warningColor: [number, number, number] = [251, 146, 60] // Orange
  const errorColor: [number, number, number] = [239, 68, 68] // Red
  
  // Page dimensions (landscape A4)
  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20

  // Add header
  pdf.setFontSize(24)
  pdf.setTextColor(...primaryColor)
  pdf.text('Campaign Report', margin, 25)
  
  pdf.setFontSize(12)
  pdf.setTextColor(...secondaryColor)
  pdf.text(`Campaign ID: ${campaignId}`, margin, 35)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 42)
  pdf.text(`Total Records: ${data.length}`, pageWidth - 80, 35)
  pdf.text(`Pages: ${Math.ceil(data.length / 25)}`, pageWidth - 80, 42)

  // Add summary statistics
  const completedCalls = data.filter(record => 
    record.status === 'CALL_COMPLETED' || 
    record.status === 'Call Completed' ||
    record.status?.toLowerCase().includes('completed')
  ).length
  
  const connectedCalls = data.filter(record => 
    record.outcome && !record.outcome.includes('--') && !record.outcome.includes('Unknown')
  ).length
  
  const avgQualityScores = data
    .filter(record => typeof record.qualityScore === 'number')
    .map(record => record.qualityScore as number)
  
  const avgQuality = avgQualityScores.length > 0 
    ? Math.round(avgQualityScores.reduce((a, b) => a + b, 0) / avgQualityScores.length)
    : 'N/A'

  // Summary box
  pdf.setDrawColor(...primaryColor)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, 50, pageWidth - 2 * margin, 25)
  
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Completed Calls: ${completedCalls}`, margin + 10, 60)
  pdf.text(`Connected Calls: ${connectedCalls}`, margin + 80, 60)
  pdf.text(`Success Rate: ${Math.round((completedCalls / data.length) * 100)}%`, margin + 150, 60)
  pdf.text(`Avg Quality Score: ${avgQuality}`, margin + 220, 60)

  // Table headers
  const headers = [
    '#',
    'Customer Name',
    'Phone',
    'Status',
    'Outcome',
    'Duration',
    'Date & Time',
    'Agent',
    'Quality Score'
  ]

  // Prepare table data
  const tableData = data.map((record, index) => [
    (index + 1).toString(),
    record.customer.name,
    record.customer.phone,
    record.status,
    record.outcome,
    record.duration,
    `${record.callDate} ${record.callTime}`,
    record.agent.name,
    record.qualityScore?.toString() || '--'
  ])

  // Add table using jsPDF AutoTable
  pdf.autoTable({
    head: [headers],
    body: tableData,
    startY: 85,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Light gray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // #
      1: { cellWidth: 35 }, // Customer Name
      2: { cellWidth: 30 }, // Phone
      3: { cellWidth: 25 }, // Status
      4: { cellWidth: 30 }, // Outcome
      5: { halign: 'center', cellWidth: 20 }, // Duration
      6: { cellWidth: 35 }, // Date & Time
      7: { cellWidth: 30 }, // Agent
      8: { halign: 'center', cellWidth: 25 } // Quality Score
    },
    didDrawCell: function(data: any) {
      // Color code status cells
      if (data.column.index === 3) { // Status column
        const status = data.cell.text[0]?.toLowerCase() || ''
        if (status.includes('completed')) {
          pdf.setFillColor(...successColor)
        } else if (status.includes('failed') || status.includes('error')) {
          pdf.setFillColor(...errorColor)
        } else if (status.includes('queue') || status.includes('live')) {
          pdf.setFillColor(...warningColor)
        }
      }
      
      // Color code quality scores
      if (data.column.index === 8) { // Quality Score column
        const score = parseInt(data.cell.text[0] || '0')
        if (score >= 80) {
          pdf.setTextColor(...successColor)
        } else if (score >= 60) {
          pdf.setTextColor(...warningColor)
        } else if (score > 0) {
          pdf.setTextColor(...errorColor)
        }
      }
    },
    didDrawPage: function(data: any) {
      // Add page footer
      const pageCount = pdf.getNumberOfPages ? pdf.getNumberOfPages() : data.pageNumber || 1
      
      pdf.setFontSize(8)
      pdf.setTextColor(...secondaryColor)
      pdf.text(
        `Page ${data.pageNumber || pageCount}`,
        pageWidth - margin - 30,
        pageHeight - 10
      )
      
      pdf.text(
        `Generated by Campaign Management System`,
        margin,
        pageHeight - 10
      )
    }
  })

  // Save the PDF
  pdf.save(filename)
}

/**
 * Captures all paginated data as a single PDF
 */
async function captureAllPagesAsPDF(
  container: HTMLElement,
  filename: string,
  options: { quality: number; scale: number }
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  let isFirstPage = true

  // Find pagination controls
  const paginationContainer = document.querySelector('[data-pagination-container]')
  const nextButton = document.querySelector('[data-pagination-next]') as HTMLButtonElement
  const currentPageElement = document.querySelector('[data-current-page]')
  
  if (!paginationContainer || !nextButton) {
    // No pagination found, capture single page
    await captureSinglePageAsPDF(container, filename, options)
    return
  }

  // Get total pages if available
  const totalPagesElement = document.querySelector('[data-total-pages]')
  const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent || '1') : null

  let currentPage = 1
  let hasMorePages = true

  while (hasMorePages) {
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Capture current page
    const canvas = await html2canvas(container, {
      scale: options.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: container.scrollHeight,
      windowHeight: container.scrollHeight
    })

    const imgData = canvas.toDataURL('image/jpeg', options.quality)
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (!isFirstPage) {
      pdf.addPage()
    }

    // Add page header with page number
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Page ${currentPage}${totalPages ? ` of ${totalPages}` : ''}`, 15, 10)

    // Add the screenshot
    pdf.addImage(imgData, 'JPEG', 0, 15, imgWidth, imgHeight)

    isFirstPage = false
    currentPage++

    // Check if there are more pages
    if (totalPages && currentPage > totalPages) {
      hasMorePages = false
    } else if (nextButton.disabled || nextButton.classList.contains('disabled')) {
      hasMorePages = false
    } else {
      // Click next page
      nextButton.click()
      // Wait for page transition
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Save the PDF
  pdf.save(filename)
}

/**
 * Captures campaign data as multi-page PDF for better UI
 */
async function captureMultiPagePDF(
  container: HTMLElement,
  filename: string,
  options: { quality: number; scale: number }
): Promise<void> {
  // Temporarily expand container to capture all content
  const originalHeight = container.style.height
  const originalOverflow = container.style.overflow
  const originalMaxHeight = container.style.maxHeight
  
  container.style.height = 'auto'
  container.style.overflow = 'visible'
  container.style.maxHeight = 'none'

  // Wait for layout to settle
  await new Promise(resolve => setTimeout(resolve, 300))

  const canvas = await html2canvas(container, {
    scale: options.scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    height: container.scrollHeight,
    windowHeight: container.scrollHeight,
    removeContainer: false
  })

  // Restore original styles
  container.style.height = originalHeight
  container.style.overflow = originalOverflow
  container.style.maxHeight = originalMaxHeight

  const imgData = canvas.toDataURL('image/jpeg', options.quality)
  const imgWidth = 190 // A4 width in mm with margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // PDF page dimensions
  const pageHeight = 297 // A4 height in mm
  const headerHeight = 25 // Space for header
  const footerHeight = 15 // Space for footer
  const availableHeight = pageHeight - headerHeight - footerHeight
  const marginLeft = 10
  
  let yPosition = 0
  let pageNumber = 1

  while (yPosition < imgHeight) {
    if (pageNumber > 1) {
      pdf.addPage()
    }

    // Add page header
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Campaign Report`, marginLeft, 15)
    
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text(new Date().toLocaleDateString(), marginLeft, 20)

    // Calculate how much of the image to show on this page
    const remainingHeight = imgHeight - yPosition
    const heightToShow = Math.min(availableHeight, remainingHeight)

    // Add the image portion
    if (heightToShow > 0) {
      // Create a temporary canvas for this page section
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        const sourceY = (yPosition / imgHeight) * canvas.height
        const sourceHeight = (heightToShow / imgHeight) * canvas.height
        
        tempCanvas.width = canvas.width
        tempCanvas.height = sourceHeight
        
        tempCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        )
        
        const pageImgData = tempCanvas.toDataURL('image/jpeg', options.quality)
        
        pdf.addImage(
          pageImgData,
          'JPEG',
          marginLeft,
          headerHeight,
          imgWidth,
          heightToShow
        )
      }
    }

    // Add page footer
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    pdf.text(`Page ${pageNumber}`, marginLeft, pageHeight - 5)
    pdf.text(`Generated on ${new Date().toLocaleString()}`, pageHeight - 60, pageHeight - 5)

    yPosition += heightToShow
    pageNumber++
  }

  pdf.save(filename)
}

/**
 * Captures a single page as PDF - Optimized for speed
 */
async function captureSinglePageAsPDF(
  container: HTMLElement,
  filename: string,
  options: { quality: number; scale: number }
): Promise<void> {
  // Use current viewport without expanding - much faster
  const canvas = await html2canvas(container, {
    scale: options.scale,
    useCORS: true,
    allowTaint: false, // Faster without taint checking
    backgroundColor: '#ffffff',
    logging: false,
    width: container.offsetWidth,
    height: container.offsetHeight,
    // Remove expensive options for speed
    removeContainer: false,
    foreignObjectRendering: false
  })

  const imgData = canvas.toDataURL('image/jpeg', options.quality)
  const imgWidth = 210 // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Add header
  pdf.setFontSize(12)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`Campaign Report`, 15, 10)
  
  pdf.setFontSize(10)
  pdf.setTextColor(128, 128, 128)
  pdf.text(new Date().toLocaleDateString(), 15, 15)

  // Simple single page approach - much faster
  const maxHeight = 270 // Max height for A4 minus header
  const finalHeight = Math.min(imgHeight, maxHeight)

  pdf.addImage(
    imgData, 
    'JPEG', 
    0, 
    20, // Header offset
    imgWidth, 
    finalHeight
  )

  pdf.save(filename)
}

/**
 * Utility functions for toast notifications
 */
function showLoadingToast(message: string): string {
  // Create a simple loading indicator
  const toastId = `toast-${Date.now()}`
  const toast = document.createElement('div')
  toast.id = toastId
  toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2'
  toast.innerHTML = `
    <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
    <span>${message}</span>
  `
  document.body.appendChild(toast)
  return toastId
}

function hideLoadingToast(toastId: string): void {
  const toast = document.getElementById(toastId)
  if (toast) {
    toast.remove()
  }
}

function showSuccessToast(message: string): void {
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.remove()
  }, 3000)
}

function showErrorToast(message: string): void {
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.remove()
  }, 5000)
}

/**
 * Alternative method using browser's print functionality
 */
export async function printCampaignData(campaignId: string): Promise<void> {
  // Create a new window with the campaign data
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Could not open print window')
  }

  // Get the campaign container content
  const campaignContainer = document.querySelector('[data-campaign-container]')
  if (!campaignContainer) {
    throw new Error('Campaign container not found')
  }

  // Create print-friendly HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Campaign Report - ${campaignId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            color: #000;
            background: #fff;
          }
          .page-break { 
            page-break-before: always; 
          }
          .no-print { 
            display: none !important; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f5f5f5; 
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Campaign Report</h1>
          <p>Campaign ID: ${campaignId}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        ${campaignContainer.innerHTML}
      </body>
    </html>
  `

  printWindow.document.write(printHTML)
  printWindow.document.close()
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 1000)
}
