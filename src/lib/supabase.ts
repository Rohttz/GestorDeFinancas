// Supabase client removed for local-only prototype mode.
// If some code still imports `supabase`, this stub will throw a helpful error.
export const supabase = new Proxy({}, {
	get() {
		throw new Error(
			'Supabase is disabled in local prototype mode. Use local services from src/services/api instead.'
		);
	},
});
