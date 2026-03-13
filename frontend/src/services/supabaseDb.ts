import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────
export interface DbHolding {
    holding_id: string;
    portfolio_id: string;
    asset_symbol: string;
    asset_type: string;
    quantity: number;
    avg_buy_price: number;
}

export interface DbPortfolio {
    portfolio_id: string;
    user_id: string;
    portfolio_name: string;
    created_at: string;
}

export interface DbWatchlistItem {
    watchlist_id: string;
    user_id: string;
    asset_symbol: string;
    added_at: string;
}

// ─── User Profile ───────────────────────────────────────────────────

/** Creates/updates user in public.users via SECURITY DEFINER RPC. */
export async function ensureUserProfile(userId: string, email: string, username?: string) {
    await new Promise((r) => setTimeout(r, 300));

    const { error } = await supabase.rpc('ensure_user_profile', {
        p_user_id: userId,
        p_email: email,
        p_username: username || email.split('@')[0],
    });

    if (error) {
        console.error('ensureUserProfile error:', error.message);
        return false;
    }
    return true;
}

// ─── Portfolios ─────────────────────────────────────────────────────

/** Gets the user's default portfolio, creating one via RPC if needed. */
export async function getOrCreateDefaultPortfolio(userId: string): Promise<string | null> {
    // Try to find existing
    const { data: existing } = await supabase
        .from('portfolios')
        .select('portfolio_id')
        .eq('portfolio_name', 'Default')
        .limit(1)
        .maybeSingle();

    if (existing?.portfolio_id) return existing.portfolio_id;

    // Create via RPC
    const { data: newId, error } = await supabase.rpc('create_portfolio', {
        p_user_id: userId,
        p_name: 'Default',
    });

    if (error) {
        console.error('createDefaultPortfolio error:', error.message);
        return null;
    }
    return newId;
}

// ─── Holdings ───────────────────────────────────────────────────────

/** Get all holdings for a portfolio via RPC (bypasses RLS). */
export async function getHoldings(portfolioId: string): Promise<DbHolding[]> {
    const { data, error } = await supabase.rpc('get_holdings', {
        p_portfolio_id: portfolioId,
    });

    if (error) {
        console.error('getHoldings error:', error.message);
        return [];
    }
    return data || [];
}

/** Add a holding via RPC (bypasses RLS). */
export async function addHolding(
    portfolioId: string,
    symbol: string,
    type: string,
    quantity: number,
    avgPrice: number
): Promise<DbHolding | null> {
    const { data, error } = await supabase.rpc('add_holding', {
        p_portfolio_id: portfolioId,
        p_symbol: symbol,
        p_type: type,
        p_quantity: quantity,
        p_avg_price: avgPrice,
    });

    if (error) {
        console.error('addHolding error:', error.message);
        return null;
    }

    // Return the holding data
    if (data) return data;

    // If RPC returns void, refetch
    const holdings = await getHoldings(portfolioId);
    return holdings.find(h => h.asset_symbol === symbol) || null;
}

/** Remove a holding via RPC (bypasses RLS). */
export async function removeHolding(holdingId: string): Promise<boolean> {
    const { error } = await supabase.rpc('remove_holding', {
        p_holding_id: holdingId,
    });

    if (error) {
        console.error('removeHolding error:', error.message);
        return false;
    }
    return true;
}

// ─── Watchlist ──────────────────────────────────────────────────────

/** Get the current user's watchlist (SELECT works via RLS). */
export async function getWatchlist(): Promise<DbWatchlistItem[]> {
    const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .order('added_at', { ascending: false });

    if (error) {
        console.error('getWatchlist error:', error.message);
        return [];
    }
    return data || [];
}

/** Add a symbol to the user's watchlist via RPC. */
export async function addToWatchlist(userId: string, symbol: string): Promise<boolean> {
    const { error } = await supabase.rpc('add_to_watchlist', {
        p_user_id: userId,
        p_symbol: symbol,
    });

    if (error) {
        console.error('addToWatchlist error:', error.message);
        return false;
    }
    return true;
}

/** Remove from watchlist via RPC. */
export async function removeFromWatchlist(watchlistId: string): Promise<boolean> {
    const { error } = await supabase.rpc('remove_from_watchlist', {
        p_watchlist_id: watchlistId,
    });

    if (error) {
        console.error('removeFromWatchlist error:', error.message);
        return false;
    }
    return true;
}
