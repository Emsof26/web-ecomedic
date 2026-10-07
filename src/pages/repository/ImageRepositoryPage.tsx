import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navigation/Navbar";
import { authRepository } from "../../repositories/authRepository";
import { clinicalStorage, type ClinicalStudy, type StudyImage, type Specialty } from "../../services/clinicalStorage";

import "./ImageRepositoryPage.css";

type SpecialtyFilter = "Todas las especialidades" | Specialty;

interface RepositoryImage extends StudyImage {
  studyId: string;
  patientId: string;
  patientName: string;
  specialty: Specialty;
  date: string;
}

const testImages = [
  "/images/ultrasound-test-1.svg",
  "/images/ultrasound-test-2.svg",
  "/images/ultrasound-test-3.svg",
  "/images/ultrasound-test-4.svg",
  "/images/ultrasound-test-5.svg",
];

// Datos demostrativos: cada imagen está asociada a un estudio concreto.
const demoImagesByStudy: Record<string, RepositoryImage[]> = {
  "study-1": [
    { name: "Obstétrica 1", type: "image/svg+xml", dataUrl: testImages[0], studyId: "study-1", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026" },
    { name: "Obstétrica 2", type: "image/svg+xml", dataUrl: testImages[1], studyId: "study-1", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026" },
    { name: "Obstétrica 3", type: "image/svg+xml", dataUrl: testImages[2], studyId: "study-1", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "09 ago 2026" },
  ],
  "study-2": [
    { name: "Obstétrica 1", type: "image/svg+xml", dataUrl: testImages[3], studyId: "study-2", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "01 jun 2026" },
    { name: "Obstétrica 2", type: "image/svg+xml", dataUrl: testImages[4], studyId: "study-2", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Obstétrica", date: "01 jun 2026" },
  ],
  "study-3": [
    { name: "Abdominal 1", type: "image/svg+xml", dataUrl: testImages[0], studyId: "study-3", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026" },
    { name: "Abdominal 2", type: "image/svg+xml", dataUrl: testImages[1], studyId: "study-3", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026" },
    { name: "Abdominal 3", type: "image/svg+xml", dataUrl: testImages[2], studyId: "study-3", patientId: "patient-1", patientName: "María Elena Vargas", specialty: "Abdominal", date: "19 ene 2026" },
  ],
  "study-4": [
    { name: "Renal 1", type: "image/svg+xml", dataUrl: testImages[3], studyId: "study-4", patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Renal", date: "27 jul 2026" },
    { name: "Renal 2", type: "image/svg+xml", dataUrl: testImages[4], studyId: "study-4", patientId: "patient-2", patientName: "José Luis Fernández", specialty: "Renal", date: "27 jul 2026" },
  ],
  "study-5": [
    { name: "Mamaria 1", type: "image/svg+xml", dataUrl: testImages[2], studyId: "study-5", patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026" },
    { name: "Mamaria 2", type: "image/svg+xml", dataUrl: testImages[3], studyId: "study-5", patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026" },
    { name: "Mamaria 3", type: "image/svg+xml", dataUrl: testImages[4], studyId: "study-5", patientId: "patient-3", patientName: "Andrea Sofía Choque", specialty: "Mamaria", date: "04 ago 2026" },
  ],
  "study-6": [
    { name: "Partes blandas 1", type: "image/svg+xml", dataUrl: testImages[0], studyId: "study-6", patientId: "patient-4", patientName: "Ricardo Aguilar", specialty: "Partes blandas", date: "14 jul 2026" },
    { name: "Partes blandas 2", type: "image/svg+xml", dataUrl: testImages[1], studyId: "study-6", patientId: "patient-4", patientName: "Ricardo Aguilar", specialty: "Partes blandas", date: "14 jul 2026" },
  ],
  "study-7": [
    { name: "Abdominal 1", type: "image/svg+xml", dataUrl: testImages[3], studyId: "study-7", patientId: "patient-5", patientName: "Lucía Rojas", specialty: "Abdominal", date: "22 may 2026" },
  ],
};

const specialties: SpecialtyFilter[] = [
  "Todas las especialidades",
  "Obstétrica",
  "Abdominal",
  "Mamaria",
  "Renal",
  "Partes blandas",
];

function getStudyImages(study: ClinicalStudy): RepositoryImage[] {
  const storedImages = study.reportData?.images;

  if (storedImages?.length) {
    return storedImages.map((image) => ({
      ...image,
      studyId: study.id,
      patientId: study.patientId,
      patientName: study.patientName,
      specialty: study.specialty,
      date: study.date,
    }));
  }

  return demoImagesByStudy[study.id] ?? [];
}

function ImageRepositoryPage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const studies = clinicalStorage.getStudies();
  const patients = clinicalStorage.getPatients();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyFilter>("Todas las especialidades");
  const [dateTerm, setDateTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<RepositoryImage | null>(null);

  const visibleStudies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedDate = dateTerm.trim().toLowerCase();

    return studies
      .map((study) => {
        const patient = patients.find((item) => item.id === study.patientId);
        return { study, images: getStudyImages(study), patientCarnet: patient?.carnet ?? "" };
      })
      .filter(({ study, patientCarnet }) => {
        const matchesPatient =
          !normalizedSearch ||
          study.patientName.toLowerCase().includes(normalizedSearch) ||
          patientCarnet.toLowerCase().includes(normalizedSearch);

        const matchesSpecialty =
          selectedSpecialty === "Todas las especialidades" ||
          study.specialty === selectedSpecialty;

        const matchesDate =
          !normalizedDate ||
          study.date.toLowerCase().includes(normalizedDate);

        return matchesPatient && matchesSpecialty && matchesDate;
      });
  }, [dateTerm, patients, searchTerm, selectedSpecialty, studies]);

  const totalImages = visibleStudies.reduce((total, item) => total + item.images.length, 0);

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
            <h1>Repositorio de Estudios</h1>
            <p>{visibleStudies.length} estudios · {totalImages} imágenes asociadas</p>
          </div>
        </header>

        <section className="study-repository-filters" aria-label="Filtros del repositorio">
          <label className="study-repository-search">
            <span>Buscar paciente</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nombre o carnet/CI"
            />
          </label>

          <label className="study-repository-search study-repository-search--date">
            <span>Buscar por fecha</span>
            <input
              type="search"
              value={dateTerm}
              onChange={(event) => setDateTerm(event.target.value)}
              placeholder="Ej. 09 ago 2026"
            />
          </label>

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
        </section>

        <div className="image-repository-page__line" />

        <section className="study-grid" aria-label="Estudios ecográficos con imágenes">
          {visibleStudies.length === 0 ? (
            <div className="image-repository-page__empty">
              No se encontraron estudios que coincidan con los filtros seleccionados.
            </div>
          ) : (
            visibleStudies.map(({ study, images, patientCarnet }) => (
              <article key={study.id} className="study-card">
                <div className="study-card__header">
                  <div>
                    <span className={`specialty-badge specialty-badge--${study.specialty.toLowerCase().replaceAll(" ", "-").replace("ó", "o")}`}>
                      {study.specialty}
                    </span>
                    <h2>{study.patientName}</h2>
                    <p>Estudio {study.id} · {study.date}</p>
                  </div>
                  <span className="study-card__image-count">{images.length} imagen(es)</span>
                </div>

                <div className="study-card__metadata">
                  <span><strong>Paciente</strong>{study.patientName}</span>
                  <span><strong>CI</strong>{patientCarnet || "No registrado"}</span>
                  <span><strong>Fecha</strong>{study.date}</span>
                </div>

                <div className="study-card__images">
                  {images.length ? (
                    images.map((image) => (
                      <button
                        key={image.name}
                        className="image-card"
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        aria-label={`Abrir imagen ${image.name} del estudio ${study.id} de ${study.patientName}`}
                      >
                        <span className="image-card__preview">
                          <img src={image.dataUrl} alt={`Imagen del estudio ${study.specialty} de ${study.patientName}`} />
                        </span>
                        <span className="image-card__body">
                          <strong>{image.name}</strong>
                          <small>{study.specialty} · {study.date}</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="study-card__no-images">Este estudio todavía no tiene imágenes asociadas.</p>
                  )}
                </div>

                <button
                  type="button"
                  className="study-card__patient-link"
                  onClick={() => navigate(`/pacientes/${study.patientId}`)}
                >
                  Ver paciente e historial
                </button>
              </article>
            ))
          )}
        </section>
      </main>

      {selectedImage && (
        <div
          className="image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de imagen"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedImage(null);
          }}
        >
          <div className="image-viewer__content">
            <div className="image-viewer__image-wrap">
              <img src={selectedImage.dataUrl} alt={`Estudio ${selectedImage.specialty} de ${selectedImage.patientName}`} />
              <span className="image-viewer__label">ECO · {selectedImage.specialty}</span>
            </div>
            <div className="image-viewer__info">
              <div>
                <strong>{selectedImage.patientName}</strong>
                <span>Estudio {selectedImage.studyId} · {selectedImage.specialty} · {selectedImage.date}</span>
              </div>
              <button
                type="button"
                className="image-viewer__patient"
                onClick={() => navigate(`/pacientes/${selectedImage.patientId}`)}
              >
                Ver paciente e historial
              </button>
            </div>
            <button className="image-viewer__close" type="button" aria-label="Cerrar imagen" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageRepositoryPage;
