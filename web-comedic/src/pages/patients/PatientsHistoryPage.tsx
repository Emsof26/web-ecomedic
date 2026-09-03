import { useMemo, useState } from "react";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { useNavigate } from "react-router-dom";

import "./PatientsHistoryPage.css";


type Specialty = "Obstétrica" | "Abdominal" | "Renal" | "Mamaria" | "Partes blandas";

interface Patient {
  id: string;
  name: string;
  carnet: string;
  sex: "Femenino" | "Masculino";
  age: number;
  studies: Specialty[];
}

const initialPatients: Patient[] = [
  { id: "patient-1", name: "María Elena Vargas", carnet: "6482913", sex: "Femenino", age: 30, studies: ["Obstétrica", "Abdominal", "Renal"] },
  { id: "patient-2", name: "José Luis Fernández", carnet: "5521048", sex: "Masculino", age: 57, studies: ["Renal", "Abdominal"] },
  { id: "patient-3", name: "Andrea Sofía Choque", carnet: "7890231", sex: "Femenino", age: 36, studies: ["Mamaria"] },
  { id: "patient-4", name: "Ricardo Aguilar", carnet: "4432109", sex: "Masculino", age: 11, studies: ["Partes blandas"] },
  { id: "patient-5", name: "Lucía Rojas", carnet: "3345678", sex: "Femenino", age: 40, studies: [] },
];

const specialties: Array<Specialty | "Todas las especialidades"> = ["Todas las especialidades", "Obstétrica", "Abdominal", "Renal", "Mamaria", "Partes blandas"];

function PatientsHistoryPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const isReceptionist = user?.role === "RECEPCIONISTA";
  const [patients, setPatients] = useState(initialPatients);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<(typeof specialties)[number]>("Todas las especialidades");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const visiblePatients = useMemo(() => patients.filter((patient) => {
    const matchesQuery = `${patient.name} ${patient.carnet}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesSpecialty = specialty === "Todas las especialidades" || patient.studies.includes(specialty);
    return matchesQuery && matchesSpecialty;
  }), [patients, query, specialty]);

  const registerPatient = (formData: FormData) => {
    const firstName = String(formData.get("firstName") ?? "").trim();
    const paternalLastName = String(formData.get("paternalLastName") ?? "").trim();
    const maternalLastName = String(formData.get("maternalLastName") ?? "").trim();
    const carnet = String(formData.get("carnet") ?? "").trim();
    const sex = String(formData.get("sex")) as Patient["sex"];
    const birthDate = new Date(String(formData.get("birthDate")));
    const age = Number.isNaN(birthDate.getTime()) ? 0 : new Date().getFullYear() - birthDate.getFullYear();

    setPatients((currentPatients) => [{
      id: crypto.randomUUID(),
      name: [firstName, paternalLastName, maternalLastName].filter(Boolean).join(" "),
      carnet,
      sex,
      age,
      studies: [],
    }, ...currentPatients]);
    setIsFormOpen(false);
  };

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="patients-page">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="patients-page__content">
        <header className="patients-page__header">
          <div><h1>Pacientes e Historiales</h1><p>Selecciona un paciente para ver su ficha y línea de tiempo</p></div>
          {!isReceptionist && <button className="patients-page__register" type="button" onClick={() => setIsFormOpen(true)}>♧&nbsp; Registrar Paciente</button>}
        </header>

        {isReceptionist && <p className="patients-page__read-only">⌁&nbsp; Modo de solo lectura: puedes consultar pacientes e historiales, pero no registrar nuevos pacientes ni editar información clínica.</p>}

        <div className="patients-page__filters">
          <label><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por CI o nombre del paciente..." /></label>
          <select value={specialty} onChange={(event) => setSpecialty(event.target.value as (typeof specialties)[number])} aria-label="Filtrar por especialidad">
            {specialties.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <section className="patients-page__grid" aria-live="polite">
          {visiblePatients.map((patient) => <button className="patient-card" type="button" key={patient.id}>
            <span className="patient-card__avatar">{patient.name.split(" ").slice(0, 2).map((name) => name[0]).join("")}</span>
            <span><strong>{patient.name}</strong><small>CI {patient.carnet} · {patient.sex} · {patient.age}a</small><em>{patient.studies.length} estudio(s) registrados</em></span>
          </button>)}
          {!visiblePatients.length && <p className="patients-page__empty">No se encontraron pacientes con esos criterios.</p>}
        </section>
      </main>

      {isFormOpen && <PatientForm onClose={() => setIsFormOpen(false)} onRegister={registerPatient} />}
    </div>
  );
}

function PatientForm({ onClose, onRegister }: { onClose: () => void; onRegister: (formData: FormData) => void }) {
  return <div className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
    <form className="patient-modal__form" onSubmit={(event) => { event.preventDefault(); onRegister(new FormData(event.currentTarget)); }}>
      <div className="patient-modal__title"><h2 id="patient-form-title">Registrar Nuevo Paciente</h2><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></div>
      <label>Nombre(s) *<input name="firstName" required placeholder="Ej. María Elena" /></label>
      <div className="patient-modal__two-columns"><label>Apellido paterno *<input name="paternalLastName" required /></label><label>Apellido materno<input name="maternalLastName" /></label></div>
      <div className="patient-modal__two-columns"><label>Cédula de identidad *<input name="carnet" required placeholder="Ej. 6482913" /></label><label>Teléfono<input name="phone" /></label></div>
      <div className="patient-modal__two-columns"><label>Fecha de nacimiento *<input name="birthDate" type="date" required /></label><label>Sexo *<select name="sex" defaultValue="Femenino"><option>Femenino</option><option>Masculino</option></select></label></div>
      <p>El sexo y la fecha de nacimiento determinan qué especialidades ecográficas estarán disponibles al crear un informe.</p>
      <div className="patient-modal__actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit">Registrar Paciente</button></div>
    </form>
  </div>;
}

export default PatientsHistoryPage;