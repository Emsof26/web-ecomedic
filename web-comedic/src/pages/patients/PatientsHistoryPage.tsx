import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { clinicalStorage, type ClinicalPatient, type Specialty } from "../../services/clinicalStorage";

import "./PatientsHistoryPage.css";

// Especialidades utilizadas para filtrar los pacientes según sus estudios registrados.
const specialties: Array<Specialty | "Todas las especialidades"> = ["Todas las especialidades", "Obstétrica", "Abdominal", "Renal", "Mamaria", "Partes blandas"];

function PatientsHistoryPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const isReceptionist = user?.role === "RECEPCIONISTA";

  // Los pacientes se mantienen en almacenamiento compartido para que también aparezcan en Inicio.
  const [patients, setPatients] = useState<ClinicalPatient[]>(() => clinicalStorage.getPatients());
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<(typeof specialties)[number]>("Todas las especialidades");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Aplica simultáneamente la búsqueda por nombre/CI y el filtro de especialidad.
  const visiblePatients = useMemo(() => patients.filter((patient) => {
    const matchesQuery = `${patient.name} ${patient.carnet}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesSpecialty = specialty === "Todas las especialidades" || patient.studies.includes(specialty);
    return matchesQuery && matchesSpecialty;
  }), [patients, query, specialty]);

  // Registra el paciente y guarda el nuevo listado para que otras páginas puedan consultarlo.
  const registerPatient = (formData: FormData) => {
    const firstName = String(formData.get("firstName") ?? "").trim();
    const paternalLastName = String(formData.get("paternalLastName") ?? "").trim();
    const maternalLastName = String(formData.get("maternalLastName") ?? "").trim();
    const carnet = String(formData.get("carnet") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const sex = String(formData.get("sex")) as ClinicalPatient["sex"];
    const birthDate = new Date(String(formData.get("birthDate")));
    const age = Number.isNaN(birthDate.getTime()) ? 0 : new Date().getFullYear() - birthDate.getFullYear();

    const newPatient: ClinicalPatient = {
      id: crypto.randomUUID(),
      name: [firstName, paternalLastName, maternalLastName].filter(Boolean).join(" "),
      carnet,
      phone,
      sex,
      age,
      studies: [],
    };

    setPatients((currentPatients) => {
      const updatedPatients = [newPatient, ...currentPatients];
      clinicalStorage.savePatients(updatedPatients);
      return updatedPatients;
    });
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
          {visiblePatients.map((patient) => <button className="patient-card" type="button" key={patient.id} onClick={() => navigate(`/pacientes/${encodeURIComponent(patient.id)}`)}>
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

// Formulario reutilizable de registro de pacientes dentro de esta pantalla.
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
