import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Input from './components/Input';
import Button from './components/Button';
import Modal from './components/Modal';
import CalendarView from './components/CalendarView';
import { AnimeCalculatorService } from './services/animeCalculatorService';
import { CalculationResult, ScheduledAnime } from './types';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

const App: React.FC = () => {
  const [animeName, setAnimeName] = useState<string>('');
  const [numberOfEpisodes, setNumberOfEpisodes] = useState<number>(0);
  const [episodeDuration, setEpisodeDuration] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [savedResults, setSavedResults] = useState<CalculationResult[]>(() => {
    const saved = localStorage.getItem('animeResults');
    return saved ? JSON.parse(saved) : [];
  });
  const [scheduledAnime, setScheduledAnime] = useState<ScheduledAnime[]>(() => {
    const saved = localStorage.getItem('scheduledAnime');
    // Ensure dates are parsed correctly
    return saved ? JSON.parse(saved).map((item: ScheduledAnime) => ({
      ...item,
      startDate: new Date(item.startDate),
      endDate: new Date(item.endDate),
    })) : [];
  });

  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [showComparativaModal, setShowComparativaModal] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [comparativaPage, setComparativaPage] = useState<number>(1);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  const [animeSuggestions, setAnimeSuggestions] = useState<any[]>([]);
  const [selectedAnimeImage, setSelectedAnimeImage] = useState<string | undefined>(undefined);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  const debounceTimeoutRef = useRef<number | null>(null);

  const fetchAnimeSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAnimeSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${JIKAN_API_BASE_URL}/anime?q=${query}&sfw`);
      if (!response.ok) {
        throw new Error(`Error fetching suggestions: ${response.statusText}`);
      }
      const data = await response.json();
      setAnimeSuggestions(data.data || []);
    } catch (error) {
      console.error("Failed to fetch anime suggestions:", error);
      setAnimeSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (animeName.length > 1 && !selectedAnimeImage) { // Only fetch if no image is already selected
      debounceTimeoutRef.current = setTimeout(() => {
        fetchAnimeSuggestions(animeName);
      }, 500); // Debounce for 500ms
    } else {
      setAnimeSuggestions([]);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [animeName, fetchAnimeSuggestions, selectedAnimeImage]);

  const handleSelectSuggestion = useCallback((suggestion: any) => {
    setAnimeName(suggestion.title);
    setSelectedAnimeImage(suggestion.images?.jpg?.image_url || undefined);
    setAnimeSuggestions([]); // Clear suggestions after selection
    if (suggestion.episodes) {
      setNumberOfEpisodes(suggestion.episodes);
      // Assuming a standard episode duration if not available from API
      setEpisodeDuration(24); 
    }
  }, []);

  const handleClearSelectedAnime = useCallback(() => {
    setAnimeName('');
    setSelectedAnimeImage(undefined);
    setNumberOfEpisodes(0);
    setEpisodeDuration(0);
    setCalculationResult(null);
  }, []);

  const handleCalculate = useCallback(() => {
    const result = AnimeCalculatorService.calculateTime(numberOfEpisodes, episodeDuration);
    setCalculationResult(result);
    if (result) {
      alert(
        `Para ver el anime completo, necesitarás ${result.days} días, ${result.hours} horas y ${result.minutes} minutos.\n` +
        `Hora de inicio: ${result.startTime} (${result.startDate})\n` +
        `Hora de finalización: ${result.endTime} (${result.endDate})\n` +
        `Número de Episodios: ${result.episodes}\n` +
        `Duración por Episodio: ${result.durationPerEpisode} minutos`
      );
    } else {
      alert("Por favor, introduce valores válidos (mayores que cero) para episodios y duración.");
    }
  }, [numberOfEpisodes, episodeDuration]);

  const handleReset = useCallback(() => {
    setNumberOfEpisodes(0);
    setEpisodeDuration(0);
    setAnimeName('');
    setCalculationResult(null);
    setSelectedAnimeImage(undefined);
    setAnimeSuggestions([]);
  }, []);

  const handleSave = useCallback(() => {
    if (calculationResult && animeName) {
      const updatedSavedResults = [...savedResults, { ...calculationResult, savedAt: new Date().toLocaleDateString('es-ES'), animeName: animeName }];
      setSavedResults(updatedSavedResults);
      localStorage.setItem('animeResults', JSON.stringify(updatedSavedResults));
      alert("Resultado guardado exitosamente.");
    } else {
      alert("No hay resultado ni nombre de anime para guardar. Calcula y nombra el anime primero.");
    }
  }, [calculationResult, savedResults, animeName]);

  const handleDeleteScheduledAnime = useCallback((id: string) => {
    if (window.confirm("¿Estás seguro de que quieres borrar este anime programado?")) {
      const updatedScheduledAnime = scheduledAnime.filter(anime => anime.id !== id);
      setScheduledAnime(updatedScheduledAnime);
      localStorage.setItem('scheduledAnime', JSON.stringify(updatedScheduledAnime));
      alert("Anime programado borrado exitosamente.");
    }
  }, [scheduledAnime]);

  const handleScheduleAnime = useCallback(() => {
    if (calculationResult && animeName) {
      const newScheduledAnime: ScheduledAnime = {
        id: crypto.randomUUID(), // Generate a unique ID
        name: animeName,
        episodes: calculationResult.episodes,
        durationPerEpisode: calculationResult.durationPerEpisode,
        totalMinutes: calculationResult.totalMinutes,
        startDate: new Date(), // For simplicity, schedule from today. Could be improved with a date picker.
        endDate: new Date(new Date().getTime() + calculationResult.totalMinutes * 60000),
        imageUrl: selectedAnimeImage,
      };
      const updatedScheduledAnime = [...scheduledAnime, newScheduledAnime];
      setScheduledAnime(updatedScheduledAnime);
      localStorage.setItem('scheduledAnime', JSON.stringify(updatedScheduledAnime));
      alert(`Anime "${animeName}" programado exitosamente!`);
      setShowCalendarModal(true); // Open calendar to see it
    } else {
      alert("Por favor, calcula un resultado y proporciona un nombre para el anime antes de programar.");
    }
  }, [calculationResult, animeName, scheduledAnime, selectedAnimeImage]);

  const handleShowSaved = useCallback(() => {
    setShowSavedModal(true);
  }, []);

  const handleShowComparativa = useCallback(() => {
    setComparativaPage(1); // Reset to first page when opening
    setShowComparativaModal(true);
  }, []);

  const handleShowCalendar = useCallback(() => {
    setShowCalendarModal(true);
  }, []);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  const comparativaContent = useMemo(() => {
    return AnimeCalculatorService.getComparativaPage(comparativaPage);
  }, [comparativaPage]);

  const calculateTotalPages = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const comparativaTotalPages = calculateTotalPages(1000, 10); // 1000 is the max chapters for comparison

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden md:max-w-lg transform hover:scale-105 transition-all duration-300">
        <div className="relative">
          <img
            alt="Anime themed background with vibrant colors and characters depicting an epic battle scene"
            className="w-full h-48 object-cover object-center"
            src={selectedAnimeImage || "https://picsum.photos/400/200?random=1"} // Placeholder or selected image
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
          <h1 className="absolute bottom-4 left-4 text-3xl font-bold text-white font-['Press_Start_2P',_cursive] z-10">
            AnimeTime
          </h1>
        </div>

        <div className="p-6 bg-gray-900">
          <p className="mt-2 text-gray-300 text-sm">
            Calcula el tiempo total necesario para ver un anime completo y planifica tus sesiones.
          </p>

          <div className="relative">
            <Input
              id="anime-name"
              label="Nombre del Anime"
              type="text"
              value={animeName}
              onChange={(e) => {
                setAnimeName(e.target.value);
                if (selectedAnimeImage) { // If an anime was selected, clear image on text change
                  setSelectedAnimeImage(undefined);
                }
              }}
              placeholder="Ej: Attack on Titan"
              autoComplete="off"
            />
            {loadingSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 p-2 text-gray-400 text-sm">
                Cargando sugerencias...
              </div>
            )}
            {!loadingSuggestions && animeSuggestions.length > 0 && !selectedAnimeImage && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto z-20 custom-scrollbar">
                {animeSuggestions.map((anime) => (
                  <li
                    key={anime.mal_id}
                    className="flex items-center p-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                    onClick={() => handleSelectSuggestion(anime)}
                    aria-label={`Seleccionar ${anime.title}`}
                  >
                    {anime.images?.jpg?.image_url && (
                      <img src={anime.images.jpg.image_url} alt={anime.title} className="w-8 h-8 object-cover rounded mr-2" />
                    )}
                    <span className="text-white text-sm">{anime.title}</span>
                  </li>
                ))}
              </ul>
            )}
            {selectedAnimeImage && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2">
                <button
                  onClick={handleClearSelectedAnime}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Borrar anime seleccionado"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>

          <Input
            id="episodios"
            label="Número de Episodios"
            type="number"
            value={numberOfEpisodes === 0 ? '' : numberOfEpisodes}
            onChange={(e) => setNumberOfEpisodes(Number(e.target.value))}
            min={1}
          />
          <Input
            id="duracion"
            label="Duración por Episodio (min)"
            type="number"
            value={episodeDuration === 0 ? '' : episodeDuration}
            onChange={(e) => setEpisodeDuration(Number(e.target.value))}
            min={1}
          />

          {calculationResult && (
            <div className="mt-6 p-4 bg-gray-700 rounded-md shadow-inner">
              <h3 className="text-lg font-bold text-indigo-400 mb-2">Resultado:</h3>
              <p className="text-gray-200">
                <i className="fas fa-hourglass-half mr-2 text-indigo-300"></i>
                Total: {calculationResult.days} días, {calculationResult.hours} horas y {calculationResult.minutes} minutos.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                <i className="fas fa-play-circle mr-2 text-green-300"></i>
                Inicio estimado: {calculationResult.startTime} ({calculationResult.startDate})
              </p>
              <p className="text-gray-400 text-sm">
                <i className="fas fa-stop-circle mr-2 text-red-300"></i>
                Fin estimado: {calculationResult.endTime} ({calculationResult.endDate})
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 sticky bottom-0 bg-gray-900 p-4 -mx-6 mb-0">
            <Button onClick={handleCalculate} iconClass="fas fa-calculator" colorClass="bg-indigo-600" label="Calcular" fullWidth />
            <Button onClick={handleReset} iconClass="fas fa-undo" colorClass="bg-red-600" label="Resetear" fullWidth />
            <Button onClick={handleSave} iconClass="fas fa-save" colorClass="bg-yellow-600" label="Guardar" fullWidth />
            <Button onClick={handleShowSaved} iconClass="fas fa-list" colorClass="bg-green-600" label="Guardados" fullWidth />
            <Button onClick={handleShowComparativa} iconClass="fas fa-table" colorClass="bg-blue-600" label="Comparar" fullWidth />
            <Button onClick={handleScheduleAnime} iconClass="fas fa-calendar-alt" colorClass="bg-purple-600" label="Programar" fullWidth />
            <Button onClick={handleShowCalendar} iconClass="fas fa-calendar-day" colorClass="bg-orange-600" label="Calendario" fullWidth />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showSavedModal} onClose={() => setShowSavedModal(false)} title="Resultados Guardados">
        {savedResults.length === 0 ? (
          <p className="text-gray-400">No hay resultados guardados.</p>
        ) : (
          <div className="space-y-4">
            {savedResults.map((res, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded-md text-sm">
                <p><span className="font-semibold text-indigo-300">Anime:</span> {res.animeName || 'N/A'}</p>
                <p><span className="font-semibold text-indigo-300">Total:</span> {res.days}d, {res.hours}h, {res.minutes}m</p>
                <p><span className="font-semibold text-indigo-300">Episodios:</span> {res.episodes}, <span className="font-semibold text-indigo-300">Duración:</span> {res.durationPerEpisode} min</p>
                <p className="text-xs text-gray-400 mt-1">Guardado el: {res.savedAt}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={showComparativaModal} onClose={() => setShowComparativaModal(false)} title="Comparativa de Capítulos y Tiempo">
        <div className="space-y-2">
          {comparativaContent.length === 0 ? (
            <p className="text-gray-400">No hay datos para mostrar.</p>
          ) : (
            comparativaContent.map((item, index) => (
              <p key={index} className="p-2 bg-gray-700 rounded-md text-sm">{item}</p>
            ))
          )}
        </div>
        <div className="flex justify-between mt-6">
          <Button
            onClick={() => setComparativaPage(prev => Math.max(1, prev - 1))}
            iconClass="fas fa-chevron-left"
            colorClass="bg-gray-600"
            label="Anterior"
            fullWidth
          />
          <span className="text-white mx-4 flex items-center justify-center text-sm">Página {comparativaPage} de {comparativaTotalPages}</span>
          <Button
            onClick={() => setComparativaPage(prev => Math.min(comparativaTotalPages, prev + 1))}
            iconClass="fas fa-chevron-right"
            colorClass="bg-gray-600"
            label="Siguiente"
            fullWidth
          />
        </div>
      </Modal>

      <Modal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} title="Calendario de Animes">
        <CalendarView
          scheduledAnime={scheduledAnime}
          onMonthChange={handleMonthChange}
          currentDate={currentCalendarDate}
          onDeleteScheduledAnime={handleDeleteScheduledAnime} // Pass the delete handler
        />
        <div className="mt-4 p-3 bg-gray-700 rounded-md text-sm">
          <h4 className="font-semibold text-indigo-300 mb-2">Leyenda:</h4>
          <div className="flex items-center mb-1">
            <span className="inline-block w-4 h-4 bg-green-700/30 rounded-sm mr-2"></span>
            <span className="text-gray-200">Días con anime programado</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 border-2 border-indigo-500 rounded-sm mr-2"></span>
            <span className="text-gray-200">Día actual</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;