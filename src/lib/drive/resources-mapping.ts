/**
 * Mapping sous-module Notion -> dossier Google Drive.
 *
 * Source de verite : le Drive d'Emeline (1oWVFOBMI6EhZ9uWntsCyB4RxM05qASlX)
 * organise en 14 modules x N sous-modules (A, B, C, D, E, F, G).
 *
 * La column "Sous-module" dans la DB Notion RESOURCES contient des valeurs
 * comme "1.A", "5.D", "8.C". On mappe vers l'ID du dossier Drive correspondant.
 *
 * Permission requise cote Drive : "Tous les utilisateurs disposant du lien"
 * (sinon 403 cote eleve). Verifie sur le dossier racine.
 */

export const DRIVE_FOLDER_ROOT_ID = "1oWVFOBMI6EhZ9uWntsCyB4RxM05qASlX";
export const DRIVE_FOLDER_ROOT_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ROOT_ID}`;

export const SOUS_MODULE_TO_FOLDER_ID: Record<string, string> = {
  // Module 1 : MINDSET
  "1.A": "1NYYwXvfHxZBOf2NY9794LjpgIMkG2Cr7",
  "1.B": "1P10fvIjEqkcDZjyTz8FdboarT6s84QLi",
  "1.C": "1Aigf0Mf0qCkxWzrOyiNltcOiPzOK9yTK",
  "1.D": "1VshBI3viJ3IEQ-cWvFqpIt0MHTa3_VYN",
  // Module 2 : TYPES DE LOCATION
  "2.A": "15yeB-UDx8WiL6Jv8vPUKs0tzJeHASLU0",
  "2.B": "1MCuUfRVb5II8WoxjEat_CJZKnH9wnBmE",
  "2.C": "1T22BK5szN_FBfjLXImzVEQClvogYF5ow",
  "2.D": "1pbFF7FdqaKa-X-i_EoJOF0aBk3cqmp-1",
  "2.E": "1j6Orpeeo39w1Jh_2ZnzEgiOmVyOPjH3R",
  "2.F": "1wrwQ7bv8UCx2vlNmUaLvW4tkY3H9lpm8",
  "2.G": "1OQ4Ga81w9FlUzZtrRLkRJ-W_r2_RcBX5",
  // Module 3 : RECHERCHES
  "3.A": "1PJKawq6TeBFckoUGKkrugxoGcOBM6S8k",
  "3.B": "1BoL2N69k9ABrYf4TLsz1x6CrbVENBdB2",
  "3.C": "1DhCKCzWyB6xDNH_Leb_cmpOVTofgvTKn",
  "3.D": "1qSE93XnWZ05SiYA0j8RbPZoOXU_grkAg",
  // Module 4 : CRITERES FINANCIERS
  "4.A": "1Hokx9rtuTQatUxMWhSMhERX5DDvFVn73",
  "4.B": "1NKpeuxb3gSzcnhffopgntF9gsqu6nQds",
  "4.C": "1xuG3HwRYjmA1we8SkekGMNlDn1dYSZz1",
  // Module 5 : ANALYSE TECHNIQUE
  "5.A": "1fRJiVT5HRISaCyvHjvlfcFKJHeV042aJ",
  "5.C": "1WjwLh1o92YueCBQGyHTIdlQG04QZ4GPu",
  "5.D": "12ttd1uyHaXk9gsNoTz9HZ9TEffGQiq8z",
  "5.E": "1Vq_BnW34tf-PZFPbZA60dnslKont_rvb",
  // Module 6 : FINANCEMENT
  "6.A": "1FI91-7hjvUP149Zo1pAZw6JgKsdW9Ske",
  "6.B": "1VvUDLv9xCKVrMPehnEKl3vmCNDAn3sJ-",
  "6.C": "1PP_k49PkAo2AwcSmS7YmXO9KvgTJOYwG",
  "6.D": "10s_cyrkjlev65NtZvxm_afFeMhM1efaM",
  "6.E": "160ISfBoY8b-ggvdWgQ7XqssqdPWl702t",
  // Module 7 : TRAVAUX
  "7.A": "1xprPu3Dkljw0zg3GKg1z0QT3Cn3vFSbL",
  "7.B": "1hq8Vhr3iCS9RFhecgnb7NkEMaFg2qEmS",
  "7.C": "11kDj6vl1gKesZC2xygMrjLG32qprZFPk",
  "7.E": "1OQUKcj2QOsLpl8S9qVXno162q5TIH18C",
  "7.F": "12PV7W6Erby120h2nem4xWs3rFPNjp4_K",
  "7.G": "1YUoKrae0jhm61nyjuz_HmHsWgoiGFCSq",
  // Module 8 : GESTION LOCATIVE
  "8.A": "15khPgZ0f6R-jK0b73rJdPfea7lsl8o1H",
  "8.B": "1OAig9Uc_UU9j4LtKFBfHq8n_FKhVQsVo",
  "8.C": "1d83rjyxOwozwk2pJOqxDMT212MWTpGqA",
  "8.D": "16YEgUWkay9Mjl3bzO5TZ_6S332G4T6r5",
  "8.E": "1SYE4vIB5VzzQnVmiulKh0aWd01RtN-q5",
  "8.F": "1AGsOh2kqPEPJyE2R06K9M3JyCwMng7XY",
  // Module 9 : IMPOSITION
  "9.A": "1sQNfzP-8u-txT19BBww9KRAXBhC8n3Ks",
  "9.B": "1LPZKfsaPDfd_VbUYmkXrW7ML5dj7JGLm",
  "9.C": "1rGShNG72UFIstyYeEOEm150oaunvYkW3",
  "9.D": "1vwyvUeiqQVh0e_6wre08V36Ub9ziCaN5",
  "9.E": "1RqFp3e-TYw_tgtCATl42IHXvTYJyb1GD",
  // Module 10 : SOCIETE
  "10.A": "1_OQQM5wtB5WaXR_GLz4snDXskX-n_zas",
  "10.B": "121pli0v3uOJjb3EJ_VRtjeVfvvb2a--X",
  "10.C": "1tWFyZ77-fpOu4C1t3pQ3vLwzOGa9vQlJ",
  "10.D": "1nite_If81Y5Mh3-c1DoP4Jr9SP-8zreC",
  "10.E": "1-6I-u7_ZspOnLTanhkDghi6H0Non6qyo",
  "10.F": "1wcl4PhNDHo5ugdFcIkAGRGeNhJ4c8QKP",
  // Module 11 : MONTAGE AVANCE
  "11.A": "1Ndlcmm0nA-wmFZVUvkFz3adlbteiAC3s",
  "11.B": "1nw7BgfOZMJvvVtrqtSVSQxGfvjXSkps2",
  "11.C": "1zDs95_23ofhQgD9xtYz-sWwHuUum2N6k",
  "11.D": "1kMdvaKVMPpdHJ-DhRKbGOxSV8qewjeiC",
  // Module 12 : ASTUCES
  "12.A": "1dhyEb5q4ZJplMqQOKgXEPpGMgppD893J",
  "12.B": "1utGervFmSLXUMRaAclub8TPNVkbU8LY7",
  "12.C": "1YLa5uTCmiq5Z6A38iOLDE4PDUrsfzZmd",
  // Module 13 : FAQ IMMOBILIERE
  "13.A": "1Qx-sWWNWqql0rtvoVX5TOXbMuL25OA7W",
  "13.B": "1-hNo59qybhTxayuL_dp30fLSrkVUeIVQ",
  "13.C": "1YXdr2bqe_L8qClmXgN4QKXYXCKwTDycB",
  // Module 14 : BONUS
  "14.A": "1xoOb-0eRK5ux5OqGTFzfzSmbi33Om8yN",
  "14.B": "10bKamjS2_VtoUEIzzeR4wN5A1YrFTAM0",
};

/**
 * Retourne l'URL Google Drive du dossier sous-module pour une ressource Notion.
 * Si le sous-module n'est pas mappe (ex: nouvelle ressource), fallback sur
 * le dossier racine du Drive (l'eleve trouvera son chemin).
 */
export function getDriveFolderUrl(sousModule: string | null | undefined): string {
  if (!sousModule) return DRIVE_FOLDER_ROOT_URL;
  const folderId = SOUS_MODULE_TO_FOLDER_ID[sousModule.trim()];
  if (!folderId) return DRIVE_FOLDER_ROOT_URL;
  return `https://drive.google.com/drive/folders/${folderId}`;
}
