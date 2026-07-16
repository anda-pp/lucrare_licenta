import { z } from 'zod';

// Schema pentru crearea unei locații noi (muzeu sau galerie)
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

// La update toate câmpurile sunt opționale
export const updateLocationSchema = createLocationSchema.partial();

// Schema pentru o recenzie — rating obligatoriu între 1 și 5
export const createReviewSchema = z.object({
    codUnicLocatie: z.string().min(1, 'Locația este obligatorie'),
    descriereRecenzie: z.string().optional(),
    rating: z.number().int().min(1).max(5, 'Rating-ul trebuie să fie între 1 și 5'),
});

// Schema pentru plasarea unei comenzi — cel puțin un bilet
export const createOrderSchema = z.object({
    tickets: z.array(z.object({
        codUnicTipBilet: z.string(),
        cantitate: z.number().int().min(1),
    })).min(1, 'Trebuie să selectezi cel puțin un bilet'),
});

// Schema pentru crearea unui tip de card de fidelitate
export const createLoyaltyCardSchema = z.object({
    numeCard: z.string().min(2, 'Numele cardului trebuie să aibă minim 2 caractere'),
    puncteCard: z.number().int().min(0).default(0),
});

// Schema pentru crearea unui eveniment — tipEveniment are o listă fixă de valori acceptate
export const createEventSchema = z.object({
    codUnicLocatie: z.string().optional().nullable(),
    titlu: z.string().min(2, 'Titlul trebuie să aibă minim 2 caractere'),
    descriere: z.string().optional().nullable(),
    dataStart: z.coerce.date({ required_error: 'Data de început este obligatorie' }),
    dataSfarsit: z.coerce.date().optional().nullable(),
    tipEveniment: z.enum(['General', 'Expozitie', 'Noaptea Muzeelor', 'Workshop']).default('General'),
    imagineUrl: z.string().optional().nullable(),
    isGratuit: z.union([z.boolean(), z.number()]).optional(),
    intervaleOrare: z.array(z.string()).optional(),
});

export const updateEventSchema = createEventSchema.partial();

// Schema pentru un artist — linkOpere poate fi URL sau string gol
export const createArtistSchema = z.object({
    nume: z.string().min(2, 'Numele artistului trebuie să aibă minim 2 caractere'),
    biografie: z.string().optional().nullable(),
    interviu: z.string().optional().nullable(),
    linkOpere: z.string().url('URL invalid pentru opere').optional().nullable().or(z.literal('')),
    imagineUrl: z.string().optional().nullable(),
});

export const updateArtistSchema = createArtistSchema.partial();

// Schema pentru tipuri de bilete gestionate de museum-admin (bilete de intrare)
export const createTicketTypeSchema = z.object({
    tipBilet: z.enum(['Adult', 'Elev', 'Student', 'Pensionar', 'Altele'], {
        errorMap: () => ({ message: 'Tip bilet invalid.' }),
    }),
    pret: z.number({ invalid_type_error: 'Prețul trebuie să fie un număr.' }).min(0, 'Prețul nu poate fi negativ.'),
});

export const updateTicketTypeSchema = createTicketTypeSchema.partial();

// Schema pentru editarea unei recenzii existente
export const updateReviewSchema = z.object({
    rating: z.number().int().min(1, 'Rating minim 1').max(5, 'Rating maxim 5'),
    descriereRecenzie: z.string().max(2000, 'Recenzia este prea lungă.').optional(),
});

// Schema pentru checkout cu Stripe — include codul promoțional și data vizitei opționale
export const checkoutSchema = z.object({
    locationId: z.string().min(1, 'locationId lipsă'),
    tickets: z.array(z.object({
        codUnicTipBilet: z.string().min(1),
        cantitate: z.number().int().min(1),
    })).min(1, 'Selectează cel puțin un bilet'),
    promoCode: z.string().optional(),
    dataVizita: z.string().optional(),
});
