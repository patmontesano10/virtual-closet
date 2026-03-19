import { createClient } from '@/lib/supabase/server'
import MeasurementForm from '@/components/measurements/MeasurementForm'
import { UserMeasurements } from '@/lib/types'

export default async function MeasurementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: measurements } = await supabase
    .from('user_measurements')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">My Measurements</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Store your body measurements to get better fit recommendations and more accurate outfit previews.
      </p>
      <MeasurementForm existing={measurements as UserMeasurements | null} userId={user!.id} />
    </div>
  )
}
