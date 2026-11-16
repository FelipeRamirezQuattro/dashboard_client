import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Select,
  Slider,
  Switch,
} from "@odessa-separator/ui";
import { AudioLines, Play } from "lucide-react";
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        closeLabel="Close settings"
        className="flex max-h-[90dvh] max-w-md flex-col overflow-hidden p-0"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-14">
          <div className="flex items-center gap-3">
            <AudioLines className="size-6 shrink-0" aria-hidden="true" />
            <DialogTitle className="text-lg">Voice Settings</DialogTitle>
          </div>
          <DialogDescription>
            Voice input and how responses are read aloud.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Voice Input Toggle */}
          <Switch
            id="voice-enabled"
            name="voice-enabled"
            label="Enable Voice Input"
            hint="Allow speaking to the chatbot using your microphone"
            checked={localSettings.enabled}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                enabled: e.target.checked,
              })
            }
          />

          {/* Auto-speak Toggle */}
          <Switch
            id="voice-auto-speak"
            name="voice-auto-speak"
            label="Auto-speak Responses"
            hint="Automatically read bot responses aloud"
            checked={localSettings.autoSpeak}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                autoSpeak: e.target.checked,
              })
            }
          />

          {/* Language Selection */}
          <Field label="Language">
            {(control) => (
              <Select
                {...control}
                name="voice-language"
                value={localSettings.language}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    language: e.target.value,
                    voiceIndex: null, // Reset voice when language changes
                  })
                }
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {/* Voice Selection */}
          {filteredVoices.length > 0 && (
            <Field label="Voice" hint="🔸 = Local voice, 🌐 = Network voice">
              {(control) => (
                <Select
                  {...control}
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
                </Select>
              )}
            </Field>
          )}

          {/* Speech Rate */}
          <RangeSetting
            label="Speech Rate"
            name="voice-rate"
            min={0.5}
            max={2.0}
            step={0.1}
            value={localSettings.rate}
            valueText={`${localSettings.rate.toFixed(1)}x`}
            scale={["Slower", "Normal", "Faster"]}
            onChange={(rate) => setLocalSettings({ ...localSettings, rate })}
          />

          {/* Pitch */}
          <RangeSetting
            label="Pitch"
            name="voice-pitch"
            min={0.5}
            max={2.0}
            step={0.1}
            value={localSettings.pitch}
            valueText={localSettings.pitch.toFixed(1)}
            scale={["Lower", "Normal", "Higher"]}
            onChange={(pitch) => setLocalSettings({ ...localSettings, pitch })}
          />

          {/* Volume */}
          <RangeSetting
            label="Volume"
            name="voice-volume"
            min={0}
            max={1}
            step={0.1}
            value={localSettings.volume}
            valueText={`${Math.round(localSettings.volume * 100)}%`}
            scale={["Quiet", "Medium", "Loud"]}
            onChange={(volume) => setLocalSettings({ ...localSettings, volume })}
          />
        </div>

        {/* Footer */}
        <DialogFooter className="mt-0 shrink-0 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={handleReset} className="sm:flex-1">
            Reset to Default
          </Button>
          <Button variant="accent" onClick={handleTest}>
            <Play className="size-4" aria-hidden="true" />
            Test
          </Button>
          <Button onClick={handleSave} className="sm:flex-1">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface RangeSettingProps {
  label: string;
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Current value as shown to the user, e.g. "1.0x" or "80%". */
  valueText: string;
  /** Three scale labels shown under the slider (low, middle, high). */
  scale: [string, string, string];
  onChange: (value: number) => void;
}

/** Slider with its current value shown next to the label, as the old settings did. */
const RangeSetting: React.FC<RangeSettingProps> = ({
  label,
  name,
  min,
  max,
  step,
  value,
  valueText,
  scale,
  onChange,
}) => (
  <Field label={label}>
    {(control) => (
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Slider
            {...control}
            name={name}
            min={min}
            max={max}
            step={step}
            value={value}
            aria-valuetext={valueText}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <output htmlFor={control.id} className="w-12 shrink-0 text-right text-sm font-medium text-text">
            {valueText}
          </output>
        </div>
        <div className="flex justify-between text-xs text-text-muted" aria-hidden="true">
          <span>{scale[0]}</span>
          <span>{scale[1]}</span>
          <span>{scale[2]}</span>
        </div>
      </div>
    )}
  </Field>
);

export default VoiceSettings;
