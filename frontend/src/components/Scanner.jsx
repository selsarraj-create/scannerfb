import React, { useState, useRef } from 'react';
import { Upload, X, ScanFace, Check } from 'lucide-react';
import ProcessingAnimation from './ProcessingAnimation';
import LeadForm from './LeadForm';
import axios from 'axios';
import { motion } from 'framer-motion';
import { compressImage } from '../utils/imageUtils';

// Use /api for production (Vercel), localhost for development
const API_URL = import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:8000';


const Scanner = () => {
    const [state, setState] = useState('IDLE'); // IDLE, PROCESSING, PREVIEW, COMPLETE
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const fileInputRef = useRef(null);

    // Handlers
    const handleFileSelect = async (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setState('PROCESSING');

        // Start Upload immediately
        try {
            // Compress Image (resize to max 1500px, 0.8 quality)
            // This prevents 413 Payload Too Large errors on Vercel with iPhone photos
            const compressedFile = await compressImage(selectedFile);

            const formData = new FormData();
            formData.append('file', compressedFile);

            const response = await axios.post(`${API_URL}/analyze`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000 // 60 seconds to accommodate Gemini API processing time
            });
            setAnalysisResult(response.data);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Analysis failed. Please try again.");
            setState('IDLE');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            handleFileSelect(droppedFile);
        }
    };

    const onAnimationComplete = () => {
        // Just signal that animation is done. 
        // The transition logic is now handled in a useEffect below.
        setState((curr) => curr === 'PROCESSING' ? 'WAITING_FOR_RESULT' : curr);
    };

    // New Effect: Handle state transition when both Animation and API are done
    React.useEffect(() => {
        if (state === 'WAITING_FOR_RESULT') {
            if (analysisResult) {
                if (analysisResult.error) {
                    console.error("Backend Error:", analysisResult.error);
                    alert(`Analysis Failed: ${analysisResult.error}`);
                    setState('IDLE');
                    return;
                }
                setState('PREVIEW');
            } else {
                // Polling logic or just wait for analysisResult to trigger re-render
                // Actually, if we are in WAITING_FOR_RESULT, we just wait. 
                // We only need a safety timeout here.
                const safetyTimer = setTimeout(() => {
                    if (!analysisResult) {
                        console.error("Analysis timed out.");
                        alert("Server timeout. Please check console logs.");
                        setState('IDLE');
                    }
                }, 30000);
                return () => clearTimeout(safetyTimer);
            }
        }
    }, [state, analysisResult]);

    // Effect: If analysis comes in EARLY (while processing), we don't do anything yet.
    // We wait for user to hit WAITING_FOR_RESULT (animation done).

    // Auto-transition if we are Waiting and result appears
    // (Handled by dependency array [analysisResult] above)

    const handleFormSuccess = () => {
        setState('COMPLETE');
    };

    const reset = () => {
        setState('IDLE');
        setFile(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[600px] flex flex-col items-center px-4">

            {/* Header */}
            <div className="mb-6 sm:mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-2">
                    10 Second <span className="text-pastel-accent">Model Scout</span>
                </h1>
                <div className="text-sm sm:text-base text-pastel-text space-y-1 font-medium">
                    <p>Could You Be A Model?</p>
                    <p>Find Out Instantly With Our AI Analysis</p>
                </div>
            </div>

            {/* Main Area */}
            <div className="relative w-full min-h-[600px] md:min-h-0 md:aspect-video bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden group">

                {/* IDLE STATE */}
                {state === 'IDLE' && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-pastel-accent transition-colors cursor-pointer p-6"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                        <div className="w-24 h-24 sm:w-20 sm:h-20 bg-pastel-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Upload className="text-pastel-accent" size={40} />
                        </div>
                        <h3 className="text-xl sm:text-xl font-semibold mb-2 text-center">Upload A Clear Selfie</h3>
                        <p className="text-gray-500 text-sm text-center">Get Your Instant AI Analysis Now!</p>
                    </div>
                )}

                {/* PROCESSING STATE */}
                {(state === 'PROCESSING' || state === 'WAITING_FOR_RESULT') && (
                    <>
                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 filter grayscale" alt="Scanning" />
                        <div className="absolute inset-0 z-10">
                            <ProcessingAnimation onComplete={onAnimationComplete} />
                        </div>
                        {state === 'WAITING_FOR_RESULT' && (
                            <div className="absolute bottom-10 left-0 right-0 text-center z-50">
                                <p className="text-pastel-accent text-xs animate-pulse">Finalizing Analysis...</p>
                            </div>
                        )}
                    </>
                )}

                {/* PREVIEW & COMPLETE STATE */}
                {(state === 'PREVIEW' || state === 'COMPLETE') && analysisResult && (
                    <div className="flex flex-col h-full md:absolute md:inset-0 md:flex-row">
                        {/* Image Side */}
                        <div className="relative w-full md:w-1/3 h-64 md:h-full">
                            <img src={previewUrl} className="w-full h-full object-cover" alt="Analyzed" />
                            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded text-xs font-mono text-pastel-accent border border-pastel-accent/30 shadow-sm">
                                {analysisResult.market_categorization?.primary?.toUpperCase() || 'ANALYZED'}
                            </div>
                        </div>

                        {/* Results Side */}
                        <div className="flex-1 p-6 md:p-8 bg-pastel-bg flex flex-col overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">Analysis Results</h2>
                                    <p className="text-sm text-pastel-muted">Powered By Vision 3.0</p>
                                    <p className="text-xs text-pastel-accent mt-1">{analysisResult.market_categorization?.primary?.toUpperCase() || 'UNKNOWN'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-pastel-accent">{analysisResult.suitability_score || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Suitability Score</div>
                                </div>
                            </div>

                            {/* Detailed Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Face Shape</div>
                                    <div className="font-medium">{analysisResult.face_geometry?.primary_shape || 'Analyzing...'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="text-xs text-gray-500 mb-1">Jawline</div>
                                    <div className="font-medium">{analysisResult.face_geometry?.jawline_definition || 'Analyzing...'}</div>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                                <span className="text-xs text-pastel-accent uppercase font-bold tracking-wider">Structural Note</span>
                                <p className="text-sm text-pastel-text mt-1 italic">"{analysisResult.face_geometry?.structural_note || 'N/A'}"</p>
                            </div>

                            {/* BLURRED SECTION (Gated Content) */}
                            <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-white p-4">

                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    <ScanFace size={18} className="text-pastel-accent" />
                                    Insider Information
                                </h3>

                                {/* The content to blur */}
                                <div className={`space-y-4 ${state === 'PREVIEW' ? 'blur-md filter select-none' : ''}`}>
                                    <div>
                                        <h4 className="text-sm text-gray-400">Aesthetic Audit</h4>
                                        <p className="text-sm mt-1">
                                            {analysisResult.aesthetic_audit?.lighting_quality || 'Unknown'} lighting detected.
                                            {analysisResult.aesthetic_audit?.technical_flaw && analysisResult.aesthetic_audit.technical_flaw !== "None" && ` Note: ${analysisResult.aesthetic_audit.technical_flaw}.`}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-gray-400">Market Rationale</h4>
                                        <p className="text-sm mt-1">
                                            {analysisResult.market_categorization?.rationale || 'Processing...'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-gray-400">Scout Verdict</h4>
                                        <p className="text-sm mt-1 font-semibold text-white">
                                            {analysisResult.scout_feedback || 'No feedback generated.'}
                                        </p>
                                    </div>
                                </div>

                                {/* GATE OVERLAY */}
                                {state === 'PREVIEW' && (
                                    <>
                                        {!showApplyForm ? (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
                                                <div className="mb-4 text-pastel-accent">
                                                    <ScanFace size={48} strokeWidth={1.5} />
                                                </div>
                                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pastel-text to-gray-400 mb-2">
                                                    Congratulations!
                                                </h3>
                                                <p className="text-pastel-text text-lg font-medium mb-6">
                                                    You have potential.
                                                </p>
                                                <button
                                                    onClick={() => setShowApplyForm(true)}
                                                    className="bg-pastel-accent hover:bg-red-300 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-pastel-accent/20"
                                                >
                                                    Apply Now
                                                </button>
                                                <p className="text-xs text-gray-400 mt-4">
                                                    Unlock your full scout report
                                                </p>
                                            </div>
                                        ) : (
                                            <LeadForm
                                                analysisData={analysisResult}
                                                imageBlob={file} // Passing blob reference if needed later
                                                onSubmitSuccess={handleFormSuccess}
                                                onCancel={() => setShowApplyForm(false)}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* {state === 'COMPLETE' && (
                                <button onClick={reset} className="mt-4 self-end text-sm text-gray-400 hover:text-white flex items-center gap-2">
                                    <X size={14} /> Scan Another Photo
                                </button>
                            )} */}

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Scanner;
