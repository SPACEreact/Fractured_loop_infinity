import React, { useState } from 'react';
import type { Seed } from '../types';
import { PhotoIcon, DocumentTextIcon } from './IconComponents';

interface BatchSelectionProps {
  phase: 'batch-select-shots' | 'batch-select-master';
  shotSeeds: Seed[];
  selectedShotsForMaster?: Seed[];
  onSelectShots: (shots: Seed[]) => void;
  onSelectMaster: (masterShot: Seed) => void;
}

const BatchSelection: React.FC<BatchSelectionProps> = ({ phase, shotSeeds, selectedShotsForMaster, onSelectShots, onSelectMaster }) => {
    const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
    const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

    const handleCheckboxChange = (shotId: string) => {
        setSelectedShotIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(shotId)) {
                newSet.delete(shotId);
            } else {
                newSet.add(shotId);
            }
            return newSet;
        });
    };

    const handleSelectShotsSubmit = () => {
        const selected = shotSeeds.filter(seed => selectedShotIds.has(seed.id));
        onSelectShots(selected);
    };

    const handleSelectMasterSubmit = () => {
        if (selectedMasterId) {
            const master = selectedShotsForMaster?.find(seed => seed.id === selectedMasterId);
            if (master) {
                onSelectMaster(master);
            }
        }
    };
    
    if (phase === 'batch-select-shots') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                 <div className="bg-gray-700/50 p-6 rounded-full mb-6 border border-gray-600">
                    <PhotoIcon className="w-16 h-16 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-100 mb-2">Image Build: Batch Mode</h2>
                <p className="text-gray-400 mb-6 max-w-lg">
                    Select the shots you want to generate images for. All selected shots will be generated in a single batch.
                </p>
                <div className="w-full max-w-md space-y-3 max-h-80 overflow-y-auto custom-scrollbar p-2">
                    {shotSeeds.map(seed => (
                        <label key={seed.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${selectedShotIds.has(seed.id) ? 'bg-indigo-900/50 border-indigo-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="checkbox"
                                checked={selectedShotIds.has(seed.id)}
                                onChange={() => handleCheckboxChange(seed.id)}
                                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <DocumentTextIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                            <div className="text-left">
                                <p className="font-bold text-gray-100">{seed.id}</p>
                                <p className="text-sm text-gray-400">{seed.summary}</p>
                            </div>
                        </label>
                    ))}
                </div>
                <button
                    onClick={handleSelectShotsSubmit}
                    disabled={selectedShotIds.size === 0}
                    className="mt-8 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors duration-200 text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Continue ({selectedShotIds.size} selected)
                </button>
            </div>
        );
    }

    if (phase === 'batch-select-master') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-gray-700/50 p-6 rounded-full mb-6 border border-gray-600">
                    <PhotoIcon className="w-16 h-16 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-100 mb-2">Select Master Style</h2>
                <p className="text-gray-400 mb-6 max-w-lg">
                    Choose one shot to act as the "Master Style". Its lighting, color, and film emulation will be applied to all other shots to ensure a consistent look.
                </p>
                <div className="w-full max-w-md space-y-3 max-h-80 overflow-y-auto custom-scrollbar p-2">
                    {selectedShotsForMaster?.map(seed => (
                         <label key={seed.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${selectedMasterId === seed.id ? 'bg-indigo-900/50 border-indigo-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="master-shot"
                                checked={selectedMasterId === seed.id}
                                onChange={() => setSelectedMasterId(seed.id)}
                                className="h-5 w-5 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <DocumentTextIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                             <div className="text-left">
                                <p className="font-bold text-gray-100">{seed.id}</p>
                                <p className="text-sm text-gray-400">{seed.summary}</p>
                            </div>
                        </label>
                    ))}
                </div>
                <button
                    onClick={handleSelectMasterSubmit}
                    disabled={!selectedMasterId}
                    className="mt-8 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors duration-200 text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Set Style & Begin
                </button>
            </div>
        )
    }

    return null;
};

export default BatchSelection;
