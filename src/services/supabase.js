import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xiqtayqigrmxkvanxsmn.supabase.co'
const supabaseKey = 'sb_publishable_x_n8vRtkYzhN24mzv5VVKg_auI4sBtI'

export const supabase = createClient(supabaseUrl, supabaseKey)
