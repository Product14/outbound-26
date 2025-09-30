/**
 * CSV Export Utilities for Campaign Data
 */

interface CampaignCSVData {
  campaignId: string
  campaignName?: string
  totalRecords?: number
}

interface CallRecord {
  id: string
  customer: {
    name: string
    phone: string
  }
  status: string
  callStatus?: string // For backward compatibility
  outcome: string
  duration: string
  callDate?: string
  callTime?: string
  timestamp: string
  agent: {
    name: string
  }
  qualityScore: number | string
  retryCount?: number
}

/**
 * Downloads all campaign data as CSV
 */
export async function downloadCampaignCSV(
  campaignId: string,
  authKey?: string
): Promise<void> {
  // Show loading toast
  const loadingToastId = showLoadingToast('Preparing CSV export...')
  
  try {

    // Validate inputs
    if (!campaignId) {
      throw new Error('Campaign ID is required for CSV export')
    }

    // Try to fetch all campaign data
    let allData: CallRecord[] = []
    
    try {
      allData = await fetchAllCampaignData(campaignId, authKey)
    } catch (fetchError) {
      console.warn('⚠️ API fetch failed, trying enhanced fallback method:', fetchError)
      
      // Enhanced Fallback: try to get ALL data by navigating through table pages
      allData = await extractAllDataFromTable()
      
      if (allData.length === 0) {
        throw new Error(`Failed to fetch campaign data: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
      }
      
    }
    
    
    if (!allData || allData.length === 0) {
      throw new Error('No data found for this campaign. The campaign may be empty or you may not have access to view the data.')
    }

    // Convert to CSV
    const csvContent = convertToCSV(allData)
    
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('Failed to generate CSV content')
    }

    // Create and download file (removed campaign ID from filename)
    const filename = `campaign-data-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSVFile(csvContent, filename)
    
    
    // Hide loading toast and show success message
    hideLoadingToast(loadingToastId)
    showSuccessToast(`CSV exported successfully! ${allData.length} records downloaded from ${Math.ceil(allData.length / 50)} pages.`)

  } catch (error) {
    console.error('❌ Error exporting CSV:', error)
    
    // Hide loading toast and show error message
    hideLoadingToast(loadingToastId)
    const errorMessage = error instanceof Error ? error.message : 'Failed to export CSV. Please try again.'
    showErrorToast(errorMessage)
    
    // Re-throw to let the UI handle the error state
    throw error
  }
}

/**
 * Fetches all campaign data across all pages
 */
async function fetchAllCampaignData(
  campaignId: string,
  authKey?: string
): Promise<CallRecord[]> {
  const allRecords: CallRecord[] = []
  let currentPage = 1
  let hasMoreData = true
  const itemsPerPage = 50 // Maximum allowed by API
  let consecutiveEmptyPages = 0
  let retryCount = 0
  const maxRetries = 3


  while (hasMoreData) {
    try {
      
      // Build API URL with correct parameter names that match the API
      const params = new URLSearchParams({
        campaignId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        showCallbacks: 'false'
        // Don't add any filters - we want ALL data for CSV export
      })

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // Add Authorization header if authKey is provided
      if (authKey) {
        headers['Authorization'] = authKey.startsWith('Bearer ') ? authKey : `Bearer ${authKey}`
      }

      const apiUrl = `/api/fetch-campaign-status?${params.toString()}`

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      })
      
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        
        if (response.status === 404) {
          throw new Error('Campaign not found. Please check the campaign ID.')
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Please check your permissions.')
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`)
        }
      }

      const data = await response.json()
      
      // Check if we have tasks data (API doesn't always return success field)
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

        // Format duration using the same logic as the table
        const durationValue = task.duration || task.callDuration
        const formattedDuration = formatDurationForTable(durationValue, task.status, task.connectionStatus, task.outcome)

        // Debug quality score processing - check multiple possible fields
        const aiQualityRaw = task.aiQuality
        const customerSentimentScore = task.customerSentimentScore
        const qualityScore = task.qualityScore
        
        // Check multiple status conditions
        const isCompleted = task.connectionStatus === 'connected' || 
                           task.status === 'CALL_COMPLETED' ||
                           task.connectionStatus === 'CALL_COMPLETED' ||
                           task.status === 'Call Completed' ||
                           task.status?.toLowerCase().includes('completed')
        
        // Try multiple quality score fields
        let qualityScoreForCSV: number | string = "--"
        let scoreSource = "none"
        
        if (isCompleted) {
          if (aiQualityRaw && !isNaN(parseFloat(aiQualityRaw))) {
            qualityScoreForCSV = parseFloat(aiQualityRaw)
            scoreSource = "aiQuality"
          } else if (qualityScore && !isNaN(parseFloat(qualityScore))) {
            qualityScoreForCSV = parseFloat(qualityScore)
            scoreSource = "qualityScore"
          } else if (customerSentimentScore && !isNaN(parseFloat(customerSentimentScore))) {
            qualityScoreForCSV = parseFloat(customerSentimentScore)
            scoreSource = "customerSentimentScore"
          }
        }
        
        // Debug both quality score and agent name for specific customers
        const isRoderickZapanta = task.leadName?.includes('RODERICK') || task.leadName?.includes('ZAPANTA')
        const isCompletedCall = task.status?.toLowerCase().includes('completed')
        
        // Debug agent name processing
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
          callStatus: task.status || 'Unknown', // For backward compatibility
          outcome: formatOutcomeText(task.outcome || '--'),
          duration: formattedDuration,
          callDate: dateStr,
          callTime: timeStr,
          timestamp: task.statusUpdatedAt || task.timestamp || task.createdAt || new Date().toISOString(),
          agent: {
            name: finalAgentName
          },
          qualityScore: qualityScoreForCSV,
          retryCount: task.retryCount || 0
        }
      })

        allRecords.push(...pageRecords)
        
        // Reset retry count on successful fetch
        retryCount = 0

        // IMPROVED PAGINATION: Use API pagination data when available
        const recordsOnThisPage = pageRecords.length
        
        // Check if API provides pagination info
        const apiPagination = data.pagination
        const totalPages = apiPagination?.totalPages
        const totalRecords = apiPagination?.total
        
        if (recordsOnThisPage === 0) {
          consecutiveEmptyPages++
        } else {
          consecutiveEmptyPages = 0 // Reset counter if we got data
        }
        
        // Determine if we should continue based on multiple factors
        let shouldContinue = false
        let reason = ''
        
        if (totalPages && currentPage < totalPages) {
          // Use API pagination if available
          shouldContinue = true
          reason = `API pagination: ${currentPage}/${totalPages}`
        } else if (recordsOnThisPage > 0) {
          // Continue if we got records and no pagination info
          shouldContinue = true
          reason = 'Got data, no pagination info'
        } else if (consecutiveEmptyPages < 3) {
          // Fallback: try a few more pages if no pagination info
          shouldContinue = true
          reason = 'Trying empty pages'
        } else {
          shouldContinue = false
          reason = totalPages ? 'Reached total pages' : 'Too many empty pages'
        }
        
        // Safety limit
        if (currentPage >= 100) {
          shouldContinue = false
          reason = 'Hit safety limit (100 pages)'
        }
        
        hasMoreData = shouldContinue
        
        
        // Continue to next page if we should
        if (hasMoreData) {
          currentPage++
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else {
        hasMoreData = false
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error)
      
      // Retry logic for failed requests
      if (retryCount < maxRetries) {
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
        continue // Retry the same page
      }
      
      // If we've exhausted retries, stop fetching more pages
      hasMoreData = false
      
      // If this is the first page and it fails after retries, re-throw the error
      if (currentPage === 1) {
        throw error
      }
      
      // For other pages, log the error but continue with what we have
      console.warn(`⚠️ Failed to fetch page ${currentPage} after ${maxRetries} retries, continuing with ${allRecords.length} records`)
    }
  }

  return allRecords
}

/**
 * Enhanced fallback: Extract ALL data by navigating through table pages
 */
async function extractAllDataFromTable(): Promise<CallRecord[]> {
  
  const allRecords: CallRecord[] = []
  let currentTablePage = 1
  let hasMoreTablePages = true
  
  // First, try to increase the page size to get all data at once
  const pageSizeSelectors = [
    'select[aria-label*="rows per page" i]',
    'select[aria-label*="items per page" i]',
    '.pagination select',
    'select option[value="100"]',
    'select option[value="200"]'
  ]
  
  let pageSizeChanged = false
  for (const selector of pageSizeSelectors) {
    const select = document.querySelector(selector) as HTMLSelectElement
    if (select) {
      const options = Array.from(select.options)
      const largestOption = options
        .filter(opt => parseInt(opt.value) > 50)
        .sort((a, b) => parseInt(b.value) - parseInt(a.value))[0]
      
      if (largestOption) {
        select.value = largestOption.value
        select.dispatchEvent(new Event('change', { bubbles: true }))
        
        // Wait for the page to update
        await new Promise(resolve => setTimeout(resolve, 2000))
        pageSizeChanged = true
        break
      }
    }
  }
  
  // Get data from current page (now potentially with more items)
  const currentPageData = await extractDataFromCurrentView()
  allRecords.push(...currentPageData)
  
  
  // If we got all the data in one page, return early
  if (pageSizeChanged && allRecords.length >= 99) {
    return allRecords
  }
  
  // Try to navigate through additional pages
  while (hasMoreTablePages && currentTablePage < 10) { // Safety limit
    
    // Try to find pagination controls with more comprehensive selectors
    
    // Try multiple ways to find pagination buttons
    const nextButtons = [
      // Standard next button selectors
      document.querySelector('button[aria-label="Next page"]'),
      document.querySelector('button[aria-label="Go to next page"]'),
      document.querySelector('[data-testid="pagination-next"]'),
      
      // Look for buttons with chevron icons (common pattern)
      ...Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.querySelector('svg') && !btn.disabled && 
        (btn.getAttribute('aria-label')?.toLowerCase().includes('next') ||
         btn.innerHTML.includes('chevron') ||
         btn.innerHTML.includes('ChevronRight'))
      ),
      
      // Look for numbered page buttons
      ...Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.trim() === String(currentTablePage + 1) && !btn.disabled
      )
    ].filter(Boolean) as HTMLButtonElement[]
    
    nextButtons.forEach((btn, index) => {
    })
    
    const targetButton = nextButtons[0]
    
    if (targetButton && !targetButton.disabled) {
      
      // Record current page data count to detect if we got new data
      const beforeCount = allRecords.length
      
      // Click the button
      targetButton.click()
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Extract data from new page
      const newPageData = await extractDataFromCurrentView()
      
      // Check if we got new data (different from what we already have)
      const newUniqueRecords = newPageData.filter(newRecord => 
        !allRecords.some(existingRecord => 
          existingRecord.customer.name === newRecord.customer.name &&
          existingRecord.customer.phone === newRecord.customer.phone
        )
      )
      
      if (newUniqueRecords.length > 0) {
        allRecords.push(...newUniqueRecords)
        currentTablePage++
      } else {
        hasMoreTablePages = false
      }
    } else {
      hasMoreTablePages = false
    }
  }
  
  return allRecords
}

/**
 * Fallback method: Extract data from current table view
 */
async function extractDataFromCurrentView(): Promise<CallRecord[]> {
  
  const records: CallRecord[] = []
  
  // Try to find the data table
  const tableRows = document.querySelectorAll('table tbody tr, [data-testid="call-row"], .call-row')
  
  
  tableRows.forEach((row, index) => {
    try {
      // Extract data from table cells with proper column mapping
      const cells = row.querySelectorAll('td, .cell, [data-cell]')
      
      if (cells.length >= 7) { // We expect 7 columns: Customer, Status, Timestamp, Duration, Outcome, Agent, Quality
        // Column 0: Customer Details (name + phone)
        const customerCell = cells[0]
        const customerName = customerCell.querySelector('.font-medium')?.textContent?.trim() || 
                           extractTextContent(customerCell).split('\n')[0]?.trim() || 'Unknown'
        const customerPhone = customerCell.querySelector('.text-gray-500')?.textContent?.trim() || 
                            extractTextContent(customerCell).split('\n')[1]?.trim() || 'Unknown'
        
        // Column 1: Status
        const status = extractTextContent(cells[1]) || 'Unknown'
        
        // Column 2: Timestamp (date + time)
        const timestampCell = cells[2]
        const date = timestampCell.querySelector('.text-gray-900')?.textContent?.trim() || ''
        const time = timestampCell.querySelector('.text-gray-500')?.textContent?.trim() || ''
        
        // Column 3: Duration
        const duration = extractTextContent(cells[3]) || '--'
        
        // Column 4: Outcome (format to proper case)
        const rawOutcome = extractTextContent(cells[4]) || '--'
        const outcome = formatOutcomeText(rawOutcome)
        
        // Column 5: Agent (full name)
        const agentCell = cells[5]
        const agentName = agentCell.querySelector('span.text-gray-900')?.textContent?.trim() || 
                        extractTextContent(agentCell) || 'Unknown'
        
        // Column 6: Quality Score
        const qualityCell = cells[6]
        const qualityText = qualityCell.textContent?.trim() || '0'
        const qualityScore = qualityText === '--' ? '--' : (parseFloat(qualityText) || 0)
        
        const record: CallRecord = {
          id: `extracted-${index}`,
          customer: {
            name: customerName,
            phone: customerPhone.replace(/[^\d+\-\s()]/g, '') // Clean phone number
          },
          status: status,
          callStatus: status,
          outcome: outcome,
          duration: duration,
          callDate: date,
          callTime: time,
          timestamp: new Date().toISOString(),
          agent: {
            name: agentName
          },
          qualityScore: qualityScore,
          retryCount: 0
        }
        
        records.push(record)
        
        // Debug log for first few records
        if (index < 3) {
          
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to extract data from row ${index}:`, error)
    }
  })
  
  return records
}

/**
 * Helper function to extract text content safely
 */
function extractTextContent(element: Element | null): string {
  if (!element) return ''
  
  // Try different methods to get text content
  const textContent = element.textContent || element.innerHTML || ''
  
  // Clean up the text (remove HTML tags, extra whitespace)
  return textContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Helper function to format outcome text to proper case
 */
function formatOutcomeText(text: string): string {
  if (!text || text === "--") return text
  
  // Convert to proper case (first letter of each word capitalized)
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Converts call records to CSV format matching the exact table structure
 */
function convertToCSV(records: CallRecord[]): string {
  if (records.length === 0) {
    return 'No data available'
  }

  // Define CSV headers to match the exact table columns displayed
  const headers = [
    'Customer Name',
    'Phone Number', 
    'Retry Count',
    'Status',
    'Date',
    'Time',
    'Duration',
    'Outcome',
    'Agent Name',
    'Quality Score'
  ]

  // Convert records to CSV rows matching the table structure exactly
  const rows = records.map(record => [
    record.customer?.name || '',
    record.customer?.phone || '',
    (record.retryCount || 0).toString(),
    record.status || record.callStatus || '',
    record.callDate || (record.timestamp ? formatDateForCSV(record.timestamp) : ''),
    record.callTime || (record.timestamp ? formatTimeForCSV(record.timestamp) : ''),
    record.duration || '',
    record.outcome || '',
    record.agent?.name || '',
    record.qualityScore.toString()
  ])

  // Combine headers and rows with proper CSV escaping
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => escapeCsvField(field)).join(','))
    .join('\n')

  return csvContent
}

/**
 * Properly escapes CSV field values
 */
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return '""'
  }
  
  const str = String(field)
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  // For empty strings, return empty quoted string
  if (str === '') {
    return '""'
  }
  
  // Otherwise return as-is
  return str
}

/**
 * Formats duration for CSV export
 */
function formatDurationForCSV(duration: string | number | undefined): string {
  if (!duration) return '--'
  
  if (typeof duration === 'string') {
    // Handle time format like "2:30" (minutes:seconds)
    if (duration.includes(':')) {
      return duration
    }
    // Parse as number string
    const numValue = parseFloat(duration)
    if (!isNaN(numValue)) {
      const seconds = numValue > 1000 ? Math.floor(numValue / 1000) : Math.floor(numValue)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  } else if (typeof duration === 'number') {
    const seconds = duration > 1000 ? Math.floor(duration / 1000) : Math.floor(duration)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return String(duration)
}

/**
 * Formats duration for table display (matches live-activity-table.tsx logic)
 */
function formatDurationForTable(callDuration: string | number | undefined, status: string, connectionStatus: string, outcome?: string): string {
  // PRIORITY: Always try to show actual duration first if available
  let durationInSeconds = 0
  
  if (callDuration !== undefined && callDuration !== null) {
    if (typeof callDuration === 'string') {
      // Handle time format like "2:30" (minutes:seconds)
      if (callDuration.includes(':')) {
        const [minutes, seconds] = callDuration.split(':').map(Number)
        if (!isNaN(minutes) && !isNaN(seconds)) {
          durationInSeconds = (minutes * 60) + seconds
        }
      } else {
        // Parse as number string
        const numValue = parseFloat(callDuration)
        if (!isNaN(numValue)) {
          // Determine if it's likely milliseconds or seconds based on magnitude
          durationInSeconds = numValue > 1000 ? Math.floor(numValue / 1000) : Math.floor(numValue)
        }
      }
    } else if (typeof callDuration === 'number') {
      // Determine if it's likely milliseconds or seconds based on magnitude
      durationInSeconds = callDuration > 1000 ? Math.floor(callDuration / 1000) : Math.floor(callDuration)
    }
  }
  
  // If we have a valid parsed duration, always show it regardless of status
  if (durationInSeconds > 0) {
    const minutes = Math.floor(durationInSeconds / 60)
    const seconds = durationInSeconds % 60
    return `${minutes}min ${seconds}sec`
  }
  
  // If duration is explicitly 0, show it as such
  if (durationInSeconds === 0 && callDuration !== undefined && callDuration !== null) {
    return "0min 0sec"
  }

  // Only show status messages when no duration data is available at all
  
  // Queue status means call hasn't started yet
  if (connectionStatus === 'queue' || status === 'QUEUED') {
    return "--"
  }
  
  // Live calls are ongoing
  if (connectionStatus === 'live' || status === 'LIVE') {
    return "--"
  }
  
  // Failed calls with no duration data
  if (connectionStatus === 'failed' || 
      connectionStatus === 'not connected' || 
      connectionStatus === 'not_connected' ||
      status === 'CALL_FAILED' ||
      status === 'failed') {
    return "--"
  }

  // Default fallback
  return "--"
}

/**
 * Formats date for CSV export
 */
function formatDateForCSV(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

/**
 * Formats time for CSV export
 */
function formatTimeForCSV(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch (error) {
    return ''
  }
}

/**
 * Formats timestamp for CSV export
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return timestamp
  }
}

/**
 * Downloads CSV content as a file
 */
function downloadCSVFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Utility functions for toast notifications (reused from pdf-utils)
 */
function showLoadingToast(message: string): string {
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
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out'
  toast.textContent = message
  document.body.appendChild(toast)
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)'
    toast.style.opacity = '1'
  }, 10)
  
  // Auto-hide after 2 seconds (shorter duration)
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)'
    toast.style.opacity = '0'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 300)
  }, 2000)
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
 * Downloads table data as CSV with exact table column structure
 */
export function downloadTableCSV(tableData: CallRecord[], filename?: string): void {
  if (!tableData || !tableData.length) {
    console.error("No table data to download");
    showErrorToast("No data available to download");
    return;
  }

  try {
    const csvContent = convertToCSV(tableData);
    const defaultFilename = filename || `campaign-data-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", defaultFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    URL.revokeObjectURL(url);
    
    showSuccessToast(`CSV exported successfully! ${tableData.length} records downloaded.`);
  } catch (error) {
    console.error("Error creating table CSV:", error);
    showErrorToast("Failed to create CSV file. Please try again.");
  }
}

/**
 * Debug function to test CSV export with current table data
 * Call this from browser console: window.debugCSVExport(campaignId, authKey)
 */
export async function debugCSVExport(campaignId: string, authKey?: string) {
  
  try {
    const allData = await fetchAllCampaignData(campaignId, authKey)
    
    
    const csvContent = convertToCSV(allData)
    
    return {
      recordCount: allData.length,
      csvPreview: csvContent.substring(0, 500),
      fullData: allData
    }
  } catch (error) {
    console.error('🔧 DEBUG: Error in CSV export test:', error)
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCSVExport = debugCSVExport;
  (window as any).testCampaignCSV = async () => await debugCSVExport('d510b925-0f66-42a8-a27a-26cbe7ab27db')
}

/**
 * Generic CSV download function that handles any array of objects
 * This is an improved version of the helper function provided by the user
 */
export function downloadCSV(data: any[], filename = "data.csv"): void {
  if (!data || !data.length) {
    console.error("No data to download");
    showErrorToast("No data available to download");
    return;
  }

  try {
    // Extract column headers from the first object
    const headers = Object.keys(data[0]);

    // Build CSV content
    const csvRows: string[] = [];
    csvRows.push(headers.map(header => escapeCsvField(header)).join(",")); // header row

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        
        // Handle null/undefined values
        if (val === null || val === undefined) {
          return escapeCsvField("");
        }
        
        // Handle arrays by joining with semicolons
        if (Array.isArray(val)) {
          val = val.join("; ");
        }
        
        // Handle objects by converting to JSON string (for nested data)
        if (typeof val === "object" && val !== null) {
          val = JSON.stringify(val);
        }
        
        // Handle boolean values
        if (typeof val === "boolean") {
          val = val ? "Yes" : "No";
        }
        
        return escapeCsvField(val);
      });
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    URL.revokeObjectURL(url);
    
    showSuccessToast(`CSV exported successfully! ${data.length} records downloaded.`);
  } catch (error) {
    console.error("Error creating CSV:", error);
    showErrorToast("Failed to create CSV file. Please try again.");
  }
}
