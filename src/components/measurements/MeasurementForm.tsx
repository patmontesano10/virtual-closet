'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserMeasurements, UnitPreference, ShoeSizeRegion } from '@/lib/types'

interface Props {
  existing: UserMeasurements | null
  userId: string
}

// Convert cm <-> inches
const toInches = (cm: number) => +(cm / 2.54).toFixed(1)
const toCm = (inches: number) => +(inches * 2.54).toFixed(1)

interface MeasurementField {
  key: keyof UserMeasurements
  label: string
  hint: string
}

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'height', label: 'Full Height', hint: 'Head to toe' },
  { key: 'head_circumference', label: 'Head Circumference', hint: 'Around the widest part of your head' },
  { key: 'neck_circumference', label: 'Neck Circumference', hint: 'Around the base of your neck' },
  { key: 'shoulder_width', label: 'Shoulder Width', hint: 'Shoulder point to shoulder point' },
  { key: 'chest_circumference', label: 'Chest', hint: 'Around the fullest part of your chest' },
  { key: 'bicep_circumference', label: 'Bicep', hint: 'Around flexed bicep at widest point' },
  { key: 'arm_length', label: 'Arm Length', hint: 'Shoulder point to wrist' },
  { key: 'wrist_circumference', label: 'Wrist', hint: 'Around your wrist bone' },
  { key: 'waist_circumference', label: 'Waist', hint: 'Around your natural waist' },
  { key: 'hip_circumference', label: 'Hips', hint: 'Around the fullest part of your hips' },
  { key: 'inseam', label: 'Inseam', hint: 'Crotch to ankle along inner leg' },
  { key: 'thigh_circumference', label: 'Thigh', hint: 'Around the fullest part of your thigh' },
]

type FormValues = Record<string, string>

function initValues(existing: UserMeasurements | null, unit: UnitPreference): FormValues {
  const values: FormValues = {}
  MEASUREMENT_FIELDS.forEach(({ key }) => {
    const raw = existing?.[key] as number | null
    if (raw == null) {
      values[key] = ''
    } else {
      values[key] = unit === 'imperial' ? String(toInches(raw)) : String(raw)
    }
  })
  values['shoe_size'] = existing?.shoe_size != null ? String(existing.shoe_size) : ''
  values['weight_kg'] = existing?.weight_kg != null ? String(existing.weight_kg) : ''
  return values
}

export default function MeasurementForm({ existing, userId }: Props) {
  const router = useRouter()
  const [unit, setUnit] = useState<UnitPreference>(existing?.unit_preference ?? 'imperial')
  const [shoeRegion, setShoeRegion] = useState<ShoeSizeRegion>(existing?.shoe_size_region ?? 'US')
  const [values, setValues] = useState<FormValues>(() => initValues(existing, unit))
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleUnitToggle(newUnit: UnitPreference) {
    if (newUnit === unit) return
    // Convert existing values
    const converted: FormValues = {}
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const v = parseFloat(values[key])
      if (isNaN(v)) {
        converted[key] = ''
      } else {
        converted[key] = newUnit === 'imperial' ? String(toInches(v)) : String(toCm(v))
      }
    })
    converted['shoe_size'] = values['shoe_size']
    converted['weight_kg'] = values['weight_kg']
    setValues(converted)
    setUnit(newUnit)
  }

  function handleChange(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Convert all values to cm for storage
    const toStore: Record<string, number | null | string> = { user_id: userId, unit_preference: unit, shoe_size_region: shoeRegion }
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const v = parseFloat(values[key])
      if (isNaN(v)) {
        toStore[key] = null
      } else {
        toStore[key] = unit === 'imperial' ? toCm(v) : v
      }
    })
    const shoe = parseFloat(values['shoe_size'])
    toStore['shoe_size'] = isNaN(shoe) ? null : shoe
    const weight = parseFloat(values['weight_kg'])
    toStore['weight_kg'] = isNaN(weight) ? null : weight

    if (existing) {
      await supabase.from('user_measurements').update(toStore).eq('user_id', userId)
    } else {
      await supabase.from('user_measurements').insert(toStore)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
    router.refresh()
  }

  const unitLabel = unit === 'imperial' ? 'in' : 'cm'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Unit toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">Units:</span>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
          {(['imperial', 'metric'] as UnitPreference[]).map(u => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitToggle(u)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                unit === u ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {u === 'imperial' ? 'Imperial (in)' : 'Metric (cm)'}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MEASUREMENT_FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {label}
              <span className="text-zinc-400 font-normal ml-1">({unitLabel})</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={values[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={hint}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        ))}

        {/* Shoe size */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Shoe Size</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={values['shoe_size']}
              onChange={e => handleChange('shoe_size', e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="10"
            />
            <select
              value={shoeRegion}
              onChange={e => setShoeRegion(e.target.value as ShoeSizeRegion)}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="US">US</option>
              <option value="EU">EU</option>
              <option value="UK">UK</option>
            </select>
          </div>
        </div>

        {/* Weight (optional) */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Weight <span className="text-zinc-400 font-normal">(kg, optional)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={values['weight_kg']}
            onChange={e => handleChange('weight_kg', e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="70"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {saved ? 'Saved!' : loading ? 'Saving…' : 'Save measurements'}
      </button>
    </form>
  )
}
