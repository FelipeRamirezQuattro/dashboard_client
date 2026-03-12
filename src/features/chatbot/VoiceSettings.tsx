import React, { useState, useEffect } from "react";
import { VoiceSettings as VoiceSettingsType } from "../../types/chatbot.types";
import { SUPPORTED_LANGUAGES } from "../../utils/voice.utils";

interface VoiceSettingsProps {
  settings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
  availableVoices: SpeechSynthesisVoice[];
  onClose: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onSettingsChange,
  availableVoices,
  onClose,
}) => {
  const [localSettings, setLocalSettings] =
    useState<VoiceSettingsType>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: VoiceSettingsType = {
      enabled: true,
      autoSpeak: false,
      language: "en-US",
      voiceIndex: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    };
    setLocalSettings(defaultSettings);
  };

  const handleTest = () => {
    const testText = "Hello! This is a test of the voice settings.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = localSettings.language;
    utterance.rate = localSettings.rate;
    utterance.pitch = localSettings.pitch;
    utterance.volume = localSettings.volume;

    if (
      localSettings.voiceIndex !== null &&
      availableVoices[localSettings.voiceIndex]
    ) {
      utterance.voice = availableVoices[localSettings.voiceIndex];
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Filter voices by selected language
  const filteredVoices = availableVoices.filter(
    (voice) =>
      voice.lang === localSettings.language ||
      voice.lang.startsWith(localSettings.language.split("-")[0]),
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-osi-primary to-osi-primary/90 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">
              settings_voice
            </span>
            <h2 className="text-lg font-semibold">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            aria-label="Close settings"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Voice Input Toggle */}
          <div className="space-y-2">
            <label
              htmlFor="voice-enabled"
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-700">
                Enable Voice Input
              </span>
              <input
                type="checkbox"
                id="voice-enabled"
                name="voice-enabled"
                checked={localSettings.enabled}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    enabled: e.target.checked,
                  })
                }
                className="w-5 h-5 text-osi-primary rounded focus:ring-2 focus:ring-osi-primary"
              />
            </label>
            <p className="text-xs text-gray-500">
              Allow speaking to the chatbot using your microphone
            </p>
          </div>

          {/* Auto-speak Toggle */}
          <div className="space-y-2">
            <label
              htmlFor="voice-auto-speak"
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-700">
                Auto-speak Responses
              </span>
              <input
                type="checkbox"
                id="voice-auto-speak"
                name="voice-auto-speak"
                checked={localSettings.autoSpeak}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    autoSpeak: e.target.checked,
                  })
                }
                className="w-5 h-5 text-osi-primary rounded focus:ring-2 focus:ring-osi-primary"
              />
            </label>
            <p className="text-xs text-gray-500">
              Automatically read bot responses aloud
            </p>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label
              htmlFor="voice-language"
              className="block text-sm font-medium text-gray-700"
            >
              Language
            </label>
            <select
              id="voice-language"
              name="voice-language"
              value={localSettings.language}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  language: e.target.value,
                  voiceIndex: null, // Reset voice when language changes
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent text-sm"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection */}
          {filteredVoices.length > 0 && (
            <div className="space-y-2">
              <label
                htmlFor="voice-selection"
                className="block text-sm font-medium text-gray-700"
              >
                Voice
              </label>
              <select
                id="voice-selection"
                name="voice-selection"
                value={localSettings.voiceIndex ?? ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    voiceIndex: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent text-sm"
              >
                <option value="">Default Voice</option>
                {filteredVoices.map((voice) => {
                  const globalIndex = availableVoices.indexOf(voice);
                  return (
                    <option key={globalIndex} value={globalIndex}>
                      {voice.name} {voice.localService ? "🔸" : "🌐"}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500">
                🔸 = Local voice, 🌐 = Network voice
              </p>
            </div>
          )}

          {/* Speech Rate */}
          <div className="space-y-2">
            <label
              htmlFor="voice-rate"
              className="block text-sm font-medium text-gray-700"
            >
              Speech Rate: {localSettings.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              id="voice-rate"
              name="voice-rate"
              min="0.5"
              max="2.0"
              step="0.1"
              value={localSettings.rate}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  rate: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-osi-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <label
              htmlFor="voice-pitch"
              className="block text-sm font-medium text-gray-700"
            >
              Pitch: {localSettings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              id="voice-pitch"
              name="voice-pitch"
              min="0.5"
              max="2.0"
              step="0.1"
              value={localSettings.pitch}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  pitch: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-osi-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Lower</span>
              <span>Normal</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <label
              htmlFor="voice-volume"
              className="block text-sm font-medium text-gray-700"
            >
              Volume: {Math.round(localSettings.volume * 100)}%
            </label>
            <input
              type="range"
              id="voice-volume"
              name="voice-volume"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.volume}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  volume: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-osi-primary"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Quiet</span>
              <span>Medium</span>
              <span>Loud</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Reset to Default
          </button>
          <button
            onClick={handleTest}
            className="px-4 py-2.5 bg-osi-secondary text-white rounded-lg hover:bg-osi-secondary/90 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              play_arrow
            </span>
            Test
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-osi-primary text-white rounded-lg hover:bg-osi-primary/90 transition-colors text-sm font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
