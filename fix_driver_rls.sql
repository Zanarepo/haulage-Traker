-- RUN THIS SQL IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- 1. Add notes column to trip_itineraries
ALTER TABLE public.trip_itineraries ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Allow drivers to add new itinerary stops for their own trips
DROP POLICY IF EXISTS "Drivers can add itinerary stops" ON public.trip_itineraries;
CREATE POLICY "Drivers can add itinerary stops" ON public.trip_itineraries
FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid())
);

-- 3. Ensure drivers can also update statuses of these new stops (matching existing update policy)
DROP POLICY IF EXISTS "Drivers can update itinerary status" ON public.trip_itineraries;
CREATE POLICY "Drivers can update itinerary status" ON public.trip_itineraries
FOR UPDATE USING (trip_id IN (SELECT id FROM trips WHERE driver_id = auth.uid()));

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'trip_itineraries';
