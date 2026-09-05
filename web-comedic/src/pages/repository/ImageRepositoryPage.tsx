import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";

import "./ImageRepositoryPage.css";

type Specialty = "Obstétrica" | "Abdominal" | "Mamaria" | "Renal" | "Partes blandas";
type SpecialtyFilter = "Todas las especialidades" | Specialty;

interface UltrasoundImage {
  id: number;
  patientId: string;
  patientName: string;
  specialty: Specialty;
  date: string;
  image: string;
}

// Imágenes de prueba para representar el repositorio mientras se integra el almacenamiento real.
const testImages = [
  "/images/ultrasound-test-1.svg",
  "/images/ultrasound-test-2.svg",
  "/images/ultrasound-test-3.svg",
  "/images/ultrasound-test-4.svg",
  "/images/ultrasound-test-5.svg",
];

// Datos demostrativos relacionados con los pacientes existentes en Pacientes e Historiales.
const initialImages: UltrasoundImage[] = [
  { id: 1, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026", image: testImages[0] },
  { id: 2, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026", image: testImages[1] },
  { id: 3, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026", image: testImages[2] },
  { id: 4, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "01 jun 2026", image: testImages[3] },
  { id: 5, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "01 jun 2026", image: testImages[4] },
  { id: 6, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026", image: testImages[0] },
  { id: 7, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026", image: testImages[1] },
  { id: 8, patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026", image: testImages[2] },
  { id: 9, patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Renal", date: "27 jul 2026", image: testImages[3] },
  { id: 10, patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Renal", date: "27 jul 2026", image: testImages[4] },
  { id: 11, patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Abdominal", date: "10 dic 2025", image: testImages[0] },
  { id: 12, patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Abdominal", date: "10 dic 2025", image: testImages[1] },
  { id: 13, patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026", image: testImages[2] },
  { id: 14, patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026", image: testImages[3] },
  { id: 15, patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026", image: testImages[4] },
  { id: 16, patientId: "patient-4", patientName: "Ricardo Aguilar", specialty: "Partes blandas", date: "14 jul 2026", image: testImages[0] },
  { id: 17, patientId: "patient-4", patientName: "Ricardo Aguilar", specialty: "Partes blandas", date: "14 jul 2026", image: testImages[1] },
  { id: 18, patientId: "patient-5", patientName: "Lucía Rojas", specialty: "Abdominal", date: "22 may 2026", image: testImages[3] },
  { id: 19, patientId: "patient-5", patientName: "Lucía Rojas", specialty: "Renal", date: "22 may 2026", image: testImages[4] },
];

const specialties: SpecialtyFilter[] = [
  "Todas las especialidades",
  "Obstétrica",
  "Abdominal",
  "Mamaria",
  "Renal",
  "Partes blandas",
];

function ImageRepositoryPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyFilter>("Todas las especialidades");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UltrasoundImage | null>(null);

  const visibleImages = useMemo(
    () => selectedSpecialty === "Todas las especialidades"
      ? initialImages
      : initialImages.filter((item) => item.specialty === selectedSpecialty),
    [selectedSpecialty],
  );

  const handleLogout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="image-repository-page">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="image-repository-page__content">
        <header className="image-repository-page__header">
          <div>
            <h1>Repositorio de Imágenes</h1>
            <p>{visibleImages.length} imágenes de estudios ecográficos</p>
          </div>

          <div className="image-repository-page__filter">
            <button
              className="specialty-filter"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isFilterOpen}
              onClick={() => setIsFilterOpen((value) => !value)}
            >
              <span>{selectedSpecialty}</span>
              <span className={`specialty-filter__arrow${isFilterOpen ? " specialty-filter__arrow--open" : ""}`}>⌄</span>
            </button>

            {isFilterOpen && (
              <div className="specialty-menu" role="listbox" aria-label="Especialidades">
                {specialties.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="option"
                    aria-selected={selectedSpecialty === item}
                    className={selectedSpecialty === item ? "specialty-menu__item specialty-menu__item--selected" : "specialty-menu__item"}
                    onClick={() => {
                      setSelectedSpecialty(item);
                      setIsFilterOpen(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="image-repository-page__line" />

        <section className="image-grid" aria-label="Imágenes ecográficas">
          {visibleImages.map((item) => (
            <button
              key={item.id}
              className="image-card"
              type="button"
              onClick={() => setSelectedImage(item)}
              aria-label={`Abrir imagen ${item.specialty} de ${item.patientName}`}
            >
              <span className="image-card__preview">
                <img src={item.image} alt="Vista previa de estudio ecográfico" />
              </span>
              <span className="image-card__body">
                <span className={`specialty-badge specialty-badge--${item.specialty.toLowerCase().replaceAll(" ", "-").replace("ó", "o")}`}>
                  {item.specialty}
                </span>
                <strong>{item.patientName}</strong>
                <small>{item.date}</small>
              </span>
            </button>
          ))}
        </section>
      </main>

      {selectedImage && (
        <div className="image-viewer" role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedImage(null); }}>
          <div className="image-viewer__content">
            <div className="image-viewer__image-wrap">
              <img src={selectedImage.image} alt={`Estudio ${selectedImage.specialty}`} />
              <span className="image-viewer__label">ECO · PB</span>
            </div>
            <div className="image-viewer__info">
              <div>
                <strong>{selectedImage.patientName}</strong>
                <span>{selectedImage.specialty} · {selectedImage.date}</span>
              </div>
              <button type="button" className="image-viewer__patient" onClick={() => navigate("/pacientes")}>Ver paciente e historial</button>
            </div>
            <button className="image-viewer__close" type="button" aria-label="Cerrar imagen" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageRepositoryPage;
