# Call Outcomes System

This document describes the comprehensive call outcomes system implemented for Sales and Service campaigns.

## Overview

The system provides standardized call outcomes categorized by campaign type (Sales vs Service) with utility functions for validation, categorization, and outcome handling.

## Call Outcome Types

### Sales Call Outcomes
- Test Drive Scheduled
- Test Drive Rescheduled
- Test Drive Cancelled
- Appointment for Purchase Discussion Scheduled
- Purchase Confirmed
- Order/Delivery Status Confirmed
- Sale Lost/Not Interested
- Follow-up Required
- No Availability Found
- Call Aborted
- Promotional Offer Accepted
- Promotional Offer Declined
- Financing/Leasing Approved
- Financing/Leasing Declined
- Trade-in Accepted
- Trade-in Declined
- Inventory Waitlist Created
- Customer Transferred to Salesperson/Manager

### Service Call Outcomes
- Service Appointment Scheduled
- Service Appointment Rescheduled
- Service Appointment Cancelled
- Recall Appointment Scheduled
- Maintenance Appointment Scheduled
- Repair Completed/Confirmed
- Drop-off/Pickup Scheduled
- Loaner Vehicle Confirmed
- Warranty Service Approved
- Warranty Renewal/Extension Accepted
- Warranty Renewal/Extension Declined
- Insurance Claim Initiated
- Complaint Logged
- Service Discount Accepted
- Service Discount Declined
- No Availability Found
- Call Aborted
- Customer Declined Service
- Follow-up Required

## Utility Functions

### Type Checking
```typescript
import { isSalesOutcome, isServiceOutcome, getOutcomeCategory } from '@/lib/call-status-utils';

// Check if outcome is sales-related
if (isSalesOutcome(outcome)) {
  // Handle sales outcome
}

// Check if outcome is service-related
if (isServiceOutcome(outcome)) {
  // Handle service outcome
}

// Get category
const category = getOutcomeCategory(outcome); // 'sales' | 'service' | 'general'
```

### Outcome Analysis
```typescript
import { isPositiveOutcome, requiresFollowUp } from '@/lib/call-status-utils';

// Check if outcome is positive/successful
if (isPositiveOutcome(outcome)) {
  // Count as success
}

// Check if outcome requires follow-up
if (requiresFollowUp(outcome)) {
  // Schedule follow-up
}
```

### Getting Outcomes by Type
```typescript
import { getOutcomesByType } from '@/lib/call-status-utils';

const salesOutcomes = getOutcomesByType('sales');
const serviceOutcomes = getOutcomesByType('service');
```

## Usage in Campaign Generation

The system automatically generates appropriate outcomes based on campaign type:

```typescript
import { generateCallStatus } from '@/lib/call-status-utils';

// Generate status for sales campaign
const salesResult = generateCallStatus(0, 100, 'sales');

// Generate status for service campaign
const serviceResult = generateCallStatus(0, 100, 'service');
```

## API Integration

The system includes mapping from Spyne API outcomes to standardized outcomes:

```typescript
// Automatic mapping in spyne-api.ts
const callRecord = mapSpyneDataToCallRecord(spyneData);
// callRecord.outcome will be properly typed as CallOutcome
```

## Type Safety

All outcomes are strongly typed using TypeScript, ensuring compile-time validation and IntelliSense support.

```typescript
import { CallOutcome, SalesCallOutcome, ServiceCallOutcome } from '@/lib/call-status-utils';

// Strongly typed outcome handling
function handleOutcome(outcome: CallOutcome) {
  // TypeScript will enforce valid outcome values
}
```
