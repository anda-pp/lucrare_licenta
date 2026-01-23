import { z } from 'zod';

// Location validation schema
export const createLocationSchema = z.object({
    tipLocatie: z.enum(['Muzeu', 'Galerie'], {
        errorMap: () => ({ message: 'Tipul trebuie să fie Muzeu sau Galerie' }),
    }),
    numeLoc: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
    orasLoc: z.string().min(2, 'Orașul trebuie să aibă minim 2 caractere'),
    judet: z.string().optional(),
    adresa: z.string().min(5, 'Adresa trebuie să aibă minim 5 caractere'),
    orar: z.string().optional(),
    scurtaDescriere: z.string().optional(),
    siteOficial: z.string().url('URL invalid').optional().or(z.literal('')),
    locatieHarta: z.string().min(5, 'Locația pe hartă este obligatorie'),
    statusLocatie: z.enum(['Activ', 'Inactiv', 'Cerere']).default('Cerere'),
    imagineUrl: z.string().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// Review validation schema
export const createReviewSchema = z.object({
    codUnicLocatie: z.string().min(1, 'Locația este obligatorie'),
    descriereRecenzie: z.string().optional(),
    rating: z.number().int().min(1).max(5, 'Rating-ul trebuie să fie între 1 și 5'),
});

// Order validation schema
export const createOrderSchema = z.object({
    tickets: z.array(z.object({
        codUnicTipBilet: z.string(),
        cantitate: z.number().int().min(1),
    })).min(1, 'Trebuie să selectezi cel puțin un bilet'),
});

// Loyalty card validation schema
export const createLoyaltyCardSchema = z.object({
    numeCard: z.string().min(2, 'Numele cardului trebuie să aibă minim 2 caractere'),
    puncteCard: z.number().int().min(0).default(0),
});
