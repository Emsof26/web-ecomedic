import { storageService } from "./storageService";

// Especialidades que puede manejar EcoMedic en los estudios ecográficos.
export type Specialty = "Obstétrica" | "Abdominal" | "Renal" | "Mamaria" | "Partes blandas";

// Datos mínimos que necesita el panel de inicio para representar a un paciente.
export interface ClinicalPatient {
  id: string;
  name: string;
  carnet: string;
  sex: "Femenino" | "Masculino";
  age: number;
  studies: Specialty[];
}

// Estados que puede mostrar un estudio en la actividad reciente.
export type StudyStatus = "Borrador" | "Firmado" | "Finalizado" | "Anulado";

// Información compartida de un informe/estudio.
export interface ClinicalStudy {
  id: string;
  patientId: string;
  patientName: string;
  specialty: Specialty;
  doctor: string;
  date: string;
  status: StudyStatus;
}

const PATIENTS_KEY = "ecomedic_patients";
const STUDIES_KEY = "ecomedic_studies";

// Pacientes de demostración que aparecen inicialmente en la aplicación.
const initialPatients: ClinicalPatient[] = [
  { id: "patient-1", name: "María Elena Vargas", carnet: "6482913", sex: "Femenino", age: 30, studies: ["Obstétrica", "Abdominal", "Renal"] },
  { id: "patient-2", name: "José Luis Fernández", carnet: "5521048", sex: "Masculino", age: 57, studies: ["Renal", "Abdominal"] },
  { id: "patient-3", name: "Andrea Sofía Choque", carnet: "7890231", sex: "Femenino", age: 36, studies: ["Mamaria"] },
  { id: "patient-4", name: "Ricardo Aguilar", carnet: "4432109", sex: "Masculino", age: 11, studies: ["Partes blandas"] },
  { id: "patient-5", name: "Lucía Rojas", carnet: "3345678", sex: "Femenino", age: 40, studies: [] },
];

// Actividad de demostración para que el inicio no aparezca vacío al comenzar.
const initialStudies: ClinicalStudy[] = [
  { id: "study-1", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", doctor: "Dr. Marcos Pérez", date: "09 ago 2026", status: "Firmado" },
  { id: "study-2", patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Renal", doctor: "Dr. Marcos Pérez", date: "27 jul 2026", status: "Finalizado" },
  { id: "study-3", patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", doctor: "Dr. Marcos Pérez", date: "04 ago 2026", status: "Borrador" },
  { id: "study-4", patientId: "patient-4", patientName: "Ricardo Aguilar", specialty: "Partes blandas", doctor: "Dr. Marcos Pérez", date: "14 jul 2026", status: "Anulado" },
  { id: "study-5", patientId: "patient-5", patientName: "Lucía Rojas", specialty: "Abdominal", doctor: "Dr. Marcos Pérez", date: "22 may 2026", status: "Firmado" },
];

export const clinicalStorage = {
  getPatients(): ClinicalPatient[] {
    return storageService.get<ClinicalPatient[]>(PATIENTS_KEY) ?? initialPatients;
  },

  savePatients(patients: ClinicalPatient[]): void {
    storageService.set(PATIENTS_KEY, patients);
  },

  getStudies(): ClinicalStudy[] {
    return storageService.get<ClinicalStudy[]>(STUDIES_KEY) ?? initialStudies;
  },

  saveStudies(studies: ClinicalStudy[]): void {
    storageService.set(STUDIES_KEY, studies);
  },

  addStudy(study: ClinicalStudy): void {
    this.saveStudies([study, ...this.getStudies()]);
  },
};
