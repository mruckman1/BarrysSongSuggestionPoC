// frontend/src/App.tsx
import React, { useState } from 'react';
import SongSearch from './components/SongSearch';
import SuggestionList from './components/SuggestionList';
import './App.css';

// Mock data for the proof of concept
const MOCK_USER_ID = 'user123';
const MOCK_INSTRUCTOR_ID = 'instructor456';
const MOCK_CLASS_ID = 'class789';

const App: React.FC = () => {
  const [view, setView] = useState<'participant' | 'instructor'>('participant');
  
  return (
    <div className="app">
      <header>
        <h1>Barry's Bootcamp Song Suggestions</h1>
        <nav>
          <button
            className={view === 'participant' ? 'active' : ''}
            onClick={() => setView('participant')}
          >
            Participant View
          </button>
          <button
            className={view === 'instructor' ? 'active' : ''}
            onClick={() => setView('instructor')}
          >
            Instructor View
          </button>
        </nav>
      </header>
      
      <main>
        {view === 'participant' ? (
          <SongSearch 
            userId={MOCK_USER_ID} 
            classId={MOCK_CLASS_ID} 
          />
        ) : (
          <SuggestionList 
            instructorId={MOCK_INSTRUCTOR_ID} 
          />
        )}
      </main>
      
      <footer>
        <p>© 2025 Barry's Bootcamp</p>
      </footer>
    </div>
  );
};

export default App;