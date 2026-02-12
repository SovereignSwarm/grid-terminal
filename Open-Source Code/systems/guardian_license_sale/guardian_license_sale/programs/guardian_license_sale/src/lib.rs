use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;
use mpl_core::instructions::CreateV1CpiBuilder;
use mpl_core::ID as METAPLEX_CORE_ID;

declare_id!("FfA1sZdQcEps96tMhNKxwu1s3MaLx86wMHCGigKUAtpm");

// Bootstrap Admin for initializing Config (Matches Grid Protocol patterns)
pub const BOOTSTRAP_ADMIN: Pubkey = anchor_lang::solana_program::pubkey!("BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU");

#[program]
pub mod guardian_license_sale {
    use super::*;

    pub fn initialize_sale(ctx: Context<InitializeSale>, tiers: Vec<TierConfig>, base_uri: String) -> Result<()> {
        let sale_state = &mut ctx.accounts.sale_state;
        
        // Permissionless Initialization Guard (restricted to Bootstrap Admin)
        require!(
            ctx.accounts.admin.key() == BOOTSTRAP_ADMIN,
            SaleError::Unauthorized
        );

        sale_state.admin = ctx.accounts.admin.key();
        sale_state.treasury = ctx.accounts.treasury.key();
        sale_state.payment_mint = ctx.accounts.payment_mint.key();
        sale_state.collection = ctx.accounts.collection.key();
        sale_state.tiers = tiers;
        sale_state.base_uri = base_uri;
        sale_state.total_licenses_sold = 0;
        sale_state.bump = ctx.bumps.sale_state;
        
        msg!("Guardian License Sale Initialized");
        Ok(())
    }

    /// Rotate administrative authority and update key configurations
    pub fn update_config(ctx: Context<UpdateConfig>, new_treasury: Option<Pubkey>, new_payment_mint: Option<Pubkey>, new_base_uri: Option<String>, new_admin: Option<Pubkey>) -> Result<()> {
        let sale_state = &mut ctx.accounts.sale_state;
        
        if let Some(treasury) = new_treasury {
            sale_state.treasury = treasury;
        }
        if let Some(mint) = new_payment_mint {
            sale_state.payment_mint = mint;
        }
        if let Some(uri) = new_base_uri {
            sale_state.base_uri = uri;
        }
        if let Some(admin) = new_admin {
            sale_state.admin = admin;
        }

        msg!("Sale config updated by {}", ctx.accounts.admin.key());
        Ok(())
    }

    /// Manage tiers dynamically (Add or Update)
    pub fn update_tiers(ctx: Context<UpdateTiers>, tiers: Vec<TierConfig>) -> Result<()> {
        let sale_state = &mut ctx.accounts.sale_state;
        sale_state.tiers = tiers;
        msg!("Tiers updated. New count: {}", sale_state.tiers.len());
        Ok(())
    }

    pub fn purchase_license_sol(ctx: Context<PurchaseLicenseSol>, tier_index: u8) -> Result<()> {
        let (price, tier_name, base_uri, bump) = {
            let sale_state = &ctx.accounts.sale_state;
            require!((tier_index as usize) < sale_state.tiers.len(), SaleError::InvalidTierIndex);
            let tier = &sale_state.tiers[tier_index as usize];
            require!(tier.sold < tier.supply_cap, SaleError::TierSoldOut);
            (tier.price_sol, tier.name.clone(), sale_state.base_uri.clone(), sale_state.bump)
        };

        // 1. Transfer SOL to Treasury
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury_info.to_account_info(),
                },
            ),
            price,
        )?;

        // 2. Mint Metaplex Core NFT
        mint_license_nft(
            &ctx.accounts.sale_state.to_account_info(),
            &base_uri,
            bump,
            &ctx.accounts.asset,
            &ctx.accounts.collection,
            &ctx.accounts.buyer,
            &ctx.accounts.payer,
            &ctx.accounts.core_program,
            &ctx.accounts.system_program,
            &tier_name,
            tier_index,
        )?;

        // 3. Update State
        let sale_state = &mut ctx.accounts.sale_state;
        let tier = &mut sale_state.tiers[tier_index as usize];
        tier.sold = tier.sold.checked_add(1).ok_or(SaleError::MathOverflow)?;
        sale_state.total_licenses_sold = sale_state.total_licenses_sold.checked_add(1).ok_or(SaleError::MathOverflow)?;

        msg!("License Purchased (SOL): {} Tier for {} Lamports", tier_name, price);
        Ok(())
    }

    pub fn purchase_license_usdc(ctx: Context<PurchaseLicenseUsdc>, tier_index: u8) -> Result<()> {
        let (price, tier_name, base_uri, bump) = {
            let sale_state = &ctx.accounts.sale_state;
            require!((tier_index as usize) < sale_state.tiers.len(), SaleError::InvalidTierIndex);
            let tier = &sale_state.tiers[tier_index as usize];
            require!(tier.sold < tier.supply_cap, SaleError::TierSoldOut);
            (tier.price_usdc, tier.name.clone(), sale_state.base_uri.clone(), sale_state.bump)
        };

        // 1. Transfer USDC to Treasury ATA
        token_interface::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.buyer_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                    mint: ctx.accounts.payment_mint.to_account_info(),
                },
            ),
            price,
            ctx.accounts.payment_mint.decimals,
        )?;

        // 2. Mint Metaplex Core NFT
        mint_license_nft(
            &ctx.accounts.sale_state.to_account_info(),
            &base_uri,
            bump,
            &ctx.accounts.asset,
            &ctx.accounts.collection,
            &ctx.accounts.buyer,
            &ctx.accounts.payer,
            &ctx.accounts.core_program,
            &ctx.accounts.system_program,
            &tier_name,
            tier_index,
        )?;

        // 3. Update State
        let sale_state = &mut ctx.accounts.sale_state;
        let tier = &mut sale_state.tiers[tier_index as usize];
        tier.sold = tier.sold.checked_add(1).ok_or(SaleError::MathOverflow)?;
        sale_state.total_licenses_sold = sale_state.total_licenses_sold.checked_add(1).ok_or(SaleError::MathOverflow)?;

        msg!("License Purchased (USDC): {} Tier for {} Units", tier_name, price);
        Ok(())
    }
}

fn mint_license_nft<'info>(
    sale_state: &AccountInfo<'info>,
    base_uri: &str,
    bump: u8,
    asset: &AccountInfo<'info>,
    collection: &AccountInfo<'info>,
    buyer: &Signer<'info>,
    payer: &Signer<'info>,
    core_program: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    tier_name: &str,
    tier_index: u8,
) -> Result<()> {
    let name = format!("GRID Guardian: {}", tier_name);
    let uri = format!("{}/tier_{}.json", base_uri, tier_index);

    let seeds = &[&b"sale_state"[..], &[bump]];
    let signer_seeds = &[&seeds[..]];

    // [CRITICAL FIX]: Added .system_program() to the builder. 
    // Metaplex Core CPI requires the system program to create the asset account.
    CreateV1CpiBuilder::new(core_program)
        .asset(asset)
        .collection(Some(collection))
        .authority(Some(sale_state.as_ref()))
        .payer(payer)
        .owner(Some(buyer.to_account_info().as_ref()))
        .system_program(system_program.as_ref())
        .name(name)
        .uri(uri)
        .invoke_signed(signer_seeds)?;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeSale<'info> {
    #[account(
        init, 
        payer = admin, 
        space = SaleState::MAX_SIZE,
        seeds = [b"sale_state"],
        bump
    )]
    pub sale_state: Account<'info, SaleState>,
    #[account(mut, address = BOOTSTRAP_ADMIN)]
    pub admin: Signer<'info>,
    /// CHECK: Treasury wallet
    pub treasury: AccountInfo<'info>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Metaplex Core Collection
    pub collection: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"sale_state"],
        bump = sale_state.bump,
        has_one = admin
    )]
    pub sale_state: Account<'info, SaleState>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTiers<'info> {
    #[account(
        mut,
        seeds = [b"sale_state"],
        bump = sale_state.bump,
        has_one = admin,
        realloc = SaleState::MAX_SIZE,
        realloc::payer = admin,
        realloc::zero = false
    )]
    pub sale_state: Account<'info, SaleState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseLicenseSol<'info> {
    #[account(
        mut,
        seeds = [b"sale_state"],
        bump = sale_state.bump
    )]
    pub sale_state: Account<'info, SaleState>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: Validated against sale_state.treasury
    #[account(mut, address = sale_state.treasury)]
    pub treasury_info: AccountInfo<'info>,
    pub asset: Signer<'info>,
    /// CHECK: Metaplex Collection validation
    #[account(mut, address = sale_state.collection)]
    pub collection: AccountInfo<'info>,
    /// CHECK: Metaplex Core program validation
    #[account(address = METAPLEX_CORE_ID)]
    pub core_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseLicenseUsdc<'info> {
    #[account(
        mut,
        seeds = [b"sale_state"],
        bump = sale_state.bump
    )]
    pub sale_state: Account<'info, SaleState>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub payment_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        constraint = buyer_token_account.mint == payment_mint.key() @ SaleError::InvalidMint,
        constraint = buyer_token_account.owner == buyer.key() @ SaleError::InvalidBuyerTokenAccount
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = treasury_token_account.mint == payment_mint.key() @ SaleError::InvalidMint,
        constraint = treasury_token_account.owner == sale_state.treasury @ SaleError::InvalidTreasuryTokenAccount
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    pub asset: Signer<'info>,
    /// CHECK: Metaplex Collection validation
    #[account(mut, address = sale_state.collection)]
    pub collection: AccountInfo<'info>,
    /// CHECK: Metaplex Core program validation
    #[account(address = METAPLEX_CORE_ID)]
    pub core_program: AccountInfo<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct SaleState {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub payment_mint: Pubkey,
    pub collection: Pubkey,
    pub tiers: Vec<TierConfig>,
    pub base_uri: String,
    pub total_licenses_sold: u64,
    pub bump: u8,
}

impl SaleState {
    pub const MAX_SIZE: usize = 8 + 32 + 32 + 32 + 32 + (4 + 10 * 128) + (4 + 200) + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TierConfig {
    pub name: String,
    pub price_sol: u64,
    pub price_usdc: u64,
    pub supply_cap: u32,
    pub sold: u32,
}

#[error_code]
pub enum SaleError {
    #[msg("This tier is sold out")]
    TierSoldOut,
    #[msg("Invalid tier index")]
    InvalidTierIndex,
    #[msg("Invalid Payment Mint")]
    InvalidMint,
    #[msg("Invalid Buyer Token Account")]
    InvalidBuyerTokenAccount,
    #[msg("Invalid Treasury Token Account")]
    InvalidTreasuryTokenAccount,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
}
