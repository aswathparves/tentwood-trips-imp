import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export interface PackageDestinationLeg {
  id?: string
  destination_id: string
  destination_name?: string
  leg_order: number
  nights: number
}

export interface PackageHotel {
  id?: string
  package_destination_id?: string
  hotel_id: string
  hotel_name?: string
  room_type_id: string
  room_type_name?: string
  meal_plan_id: string
  meal_plan_name?: string
  tier: 'budget' | 'standard' | 'deluxe' | 'luxury'
  room_count: number
  occupancy_type: 'single' | 'double' | 'triple'
  check_in_date?: string
  check_out_date?: string
  notes?: string
  leg_order: number
}

export interface PackageTransfer {
  id?: string
  transfer_type: string
  location_name: string
  vehicle_id?: string
  vehicle_name?: string
  is_pickup: boolean
  date?: string
  time?: string
  flight_train_no?: string
  notes?: string
}

export interface PackageIntercityTransfer {
  id?: string
  from_destination_id?: string
  to_destination_id?: string
  from_name?: string
  to_name?: string
  vehicle_id?: string
  vehicle_name?: string
  mode: string
  distance_km?: number
  duration_hours?: number
  notes?: string
}

export interface DayActivity {
  id?: string
  activity_id?: string
  activity_name?: string
  custom_name?: string
  custom_description?: string
  sort_order: number
  time_slot?: string
  duration_hours?: number
  is_optional: boolean
  notes?: string
}

export interface PackageDay {
  id?: string
  day_number: number
  title?: string
  date?: string
  vehicle_id?: string
  vehicle_name?: string
  meals_included: string[]
  notes?: string
  ai_description?: string
  activities: DayActivity[]
  destination_leg_order?: number
}

export interface PackagePricing {
  cost_per_adult: number
  cost_per_child: number
  cost_per_infant: number
  single_supplement: number
  triple_reduction: number
  markup_percent: number
  discount_amount: number
  discount_reason: string
  gst_percent: number
  base_total: number
  gst_total: number
  grand_total: number
  advance_amount: number
  show_cost_breakup: boolean
}

export interface PaymentScheduleRow {
  id?: string
  due_date: string
  amount: number
  description: string
  is_paid: boolean
}

export interface PackageBuilderState {
  // Package ID (set after first save)
  packageId: string | null

  // Header
  name: string
  package_code: string
  category: string
  status: string
  internal_notes: string

  // Guests
  adults: number
  children: number
  infants: number
  children_ages: number[]

  // Destinations
  destinations: PackageDestinationLeg[]

  // Hotels
  hotels: PackageHotel[]

  // Transportation
  transfers: PackageTransfer[]
  intercityTransfers: PackageIntercityTransfer[]

  // Days
  days: PackageDay[]

  // Inclusions
  inclusions: { id?: string; text: string; type: 'inclusion' | 'exclusion' }[]

  // Pricing
  pricing: PackagePricing

  // Payment schedule
  paymentSchedule: PaymentScheduleRow[]

  // Policies
  tnc_policy_id: string
  tnc_content: string
  cancellation_policy_id: string
  cancellation_content: string

  // Reviews
  selected_review_ids: string[]

  // UI state
  saving: boolean
  lastSaved: Date | null
  saveError: string | null
  isDirty: boolean

  // Actions
  setField: (field: string, value: any) => void
  setPackageId: (id: string) => void
  initDays: (nights: number) => void
  updateDay: (dayNumber: number, updates: Partial<PackageDay>) => void
  addActivityToDay: (dayNumber: number, activity: DayActivity) => void
  removeActivityFromDay: (dayNumber: number, activityIndex: number) => void
  reorderActivities: (dayNumber: number, activities: DayActivity[]) => void
  addDestination: (leg: PackageDestinationLeg) => void
  removeDestination: (legOrder: number) => void
  updateDestination: (legOrder: number, updates: Partial<PackageDestinationLeg>) => void
  addHotel: (hotel: PackageHotel) => void
  removeHotel: (index: number) => void
  updateHotel: (index: number, updates: Partial<PackageHotel>) => void
  addTransfer: (transfer: PackageTransfer) => void
  removeTransfer: (index: number) => void
  addIntercityTransfer: (transfer: PackageIntercityTransfer) => void
  removeIntercityTransfer: (index: number) => void
  addInclusion: (item: { text: string; type: 'inclusion' | 'exclusion' }) => void
  removeInclusion: (index: number) => void
  updatePricing: (updates: Partial<PackagePricing>) => void
  addPaymentRow: (row: PaymentScheduleRow) => void
  removePaymentRow: (index: number) => void
  toggleReview: (reviewId: string) => void
  markDirty: () => void
  markSaved: () => void
  setSaving: (saving: boolean) => void
  setSaveError: (error: string | null) => void
  resetStore: () => void
}

const defaultPricing: PackagePricing = {
  cost_per_adult: 0,
  cost_per_child: 0,
  cost_per_infant: 0,
  single_supplement: 0,
  triple_reduction: 0,
  markup_percent: 0,
  discount_amount: 0,
  discount_reason: '',
  gst_percent: 5,
  base_total: 0,
  gst_total: 0,
  grand_total: 0,
  advance_amount: 0,
  show_cost_breakup: false,
}

const initialState = {
  packageId: null,
  name: '',
  package_code: '',
  category: 'custom',
  status: 'draft',
  internal_notes: '',
  adults: 2,
  children: 0,
  infants: 0,
  children_ages: [],
  destinations: [],
  hotels: [],
  transfers: [],
  intercityTransfers: [],
  days: [],
  inclusions: [],
  pricing: defaultPricing,
  paymentSchedule: [],
  tnc_policy_id: '',
  tnc_content: '',
  cancellation_policy_id: '',
  cancellation_content: '',
  selected_review_ids: [],
  saving: false,
  lastSaved: null,
  saveError: null,
  isDirty: false,
}

export const usePackageBuilder = create<PackageBuilderState>((set, get) => ({
  ...initialState,

  setField: (field, value) => {
    set((state) => ({ ...state, [field]: value, isDirty: true }))
  },

  setPackageId: (id) => set({ packageId: id }),

  initDays: (nights) => {
    const totalDays = nights + 1
    const existing = get().days
    const newDays: PackageDay[] = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1
      const existing_day = existing.find((d) => d.day_number === dayNum)
      return existing_day ?? {
        day_number: dayNum,
        title: dayNum === 1 ? 'Arrival Day' : dayNum === totalDays ? 'Departure Day' : `Day ${dayNum}`,
        meals_included: [],
        activities: [],
      }
    })
    set({ days: newDays, isDirty: true })
  },

  updateDay: (dayNumber, updates) => {
    set((state) => ({
      days: state.days.map((d) =>
        d.day_number === dayNumber ? { ...d, ...updates } : d
      ),
      isDirty: true,
    }))
  },

  addActivityToDay: (dayNumber, activity) => {
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d
        const exists = d.activities.some(
          (a) => a.activity_id && a.activity_id === activity.activity_id
        )
        if (exists) return d
        return {
          ...d,
          activities: [
            ...d.activities,
            { ...activity, sort_order: d.activities.length },
          ],
        }
      }),
      isDirty: true,
    }))
  },

  removeActivityFromDay: (dayNumber, activityIndex) => {
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d
        return {
          ...d,
          activities: d.activities
            .filter((_, i) => i !== activityIndex)
            .map((a, i) => ({ ...a, sort_order: i })),
        }
      }),
      isDirty: true,
    }))
  },

  reorderActivities: (dayNumber, activities) => {
    set((state) => ({
      days: state.days.map((d) =>
        d.day_number === dayNumber ? { ...d, activities } : d
      ),
      isDirty: true,
    }))
  },

  addDestination: (leg) => {
    set((state) => ({
      destinations: [...state.destinations, leg],
      isDirty: true,
    }))
  },

  removeDestination: (legOrder) => {
    set((state) => ({
      destinations: state.destinations
        .filter((d) => d.leg_order !== legOrder)
        .map((d, i) => ({ ...d, leg_order: i + 1 })),
      isDirty: true,
    }))
  },

  updateDestination: (legOrder, updates) => {
    set((state) => ({
      destinations: state.destinations.map((d) =>
        d.leg_order === legOrder ? { ...d, ...updates } : d
      ),
      isDirty: true,
    }))
  },

  addHotel: (hotel) => {
    set((state) => ({ hotels: [...state.hotels, hotel], isDirty: true }))
  },

  removeHotel: (index) => {
    set((state) => ({
      hotels: state.hotels.filter((_, i) => i !== index),
      isDirty: true,
    }))
  },

  updateHotel: (index, updates) => {
    set((state) => ({
      hotels: state.hotels.map((h, i) => (i === index ? { ...h, ...updates } : h)),
      isDirty: true,
    }))
  },

  addTransfer: (transfer) => {
    set((state) => ({
      transfers: [...state.transfers, transfer],
      isDirty: true,
    }))
  },

  removeTransfer: (index) => {
    set((state) => ({
      transfers: state.transfers.filter((_, i) => i !== index),
      isDirty: true,
    }))
  },

  addIntercityTransfer: (transfer) => {
    set((state) => ({
      intercityTransfers: [...state.intercityTransfers, transfer],
      isDirty: true,
    }))
  },

  removeIntercityTransfer: (index) => {
    set((state) => ({
      intercityTransfers: state.intercityTransfers.filter((_, i) => i !== index),
      isDirty: true,
    }))
  },

  addInclusion: (item) => {
    set((state) => ({
      inclusions: [...state.inclusions, item],
      isDirty: true,
    }))
  },

  removeInclusion: (index) => {
    set((state) => ({
      inclusions: state.inclusions.filter((_, i) => i !== index),
      isDirty: true,
    }))
  },

  updatePricing: (updates) => {
    set((state) => ({
      pricing: { ...state.pricing, ...updates },
      isDirty: true,
    }))
  },

  addPaymentRow: (row) => {
    set((state) => ({
      paymentSchedule: [...state.paymentSchedule, row],
      isDirty: true,
    }))
  },

  removePaymentRow: (index) => {
    set((state) => ({
      paymentSchedule: state.paymentSchedule.filter((_, i) => i !== index),
      isDirty: true,
    }))
  },

  toggleReview: (reviewId) => {
    set((state) => ({
      selected_review_ids: state.selected_review_ids.includes(reviewId)
        ? state.selected_review_ids.filter((id) => id !== reviewId)
        : [...state.selected_review_ids, reviewId],
      isDirty: true,
    }))
  },

  markDirty: () => set({ isDirty: true }),
  markSaved: () => set({ isDirty: false, lastSaved: new Date(), saveError: null }),
  setSaving: (saving) => set({ saving }),
  setSaveError: (error) => set({ saveError: error }),

  resetStore: () => set({ ...initialState }),
}))