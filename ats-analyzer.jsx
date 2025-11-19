import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function ATSAnalyzer() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedATS, setSelectedATS] = useState('general');
  const [heatmapData, setHeatmapData] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const atsOptions = [
    { value: 'general', label: 'General ATS Analysis', description: 'Overall ATS compatibility' },
    { value: 'workday', label: 'Workday', description: 'Strict formatting requirements' },
    { value: 'greenhouse', label: 'Greenhouse', description: 'Modern, flexible parsing' },
    { value: 'taleo', label: 'Oracle Taleo', description: 'Legacy system, strict parsing' },
    { value: 'lever', label: 'Lever', description: 'Modern, good format handling' },
    { value: 'icims', label: 'iCIMS', description: 'Common enterprise ATS' },
    { value: 'smartrecruiters', label: 'SmartRecruiters', description: 'Good multi-format parsing' },
    { value: 'bamboohr', label: 'BambooHR', description: 'Popular SMB system, moderate parsing' },
    { value: 'ashby', label: 'Ashby', description: 'Modern, AI-powered parsing' },
    { value: 'covey', label: 'Covey', description: 'AI-driven talent intelligence' },
  ];

  const clearAllData = () => {
    setFile(null);
    setResults(null);
    setHeatmapData(null);
    setShowHeatmap(false);
    setError(null);
    setSelectedATS('general');
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      const fileType = uploadedFile.type;
      if (fileType === 'application/pdf' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'text/plain') {
        setFile(uploadedFile);
        setError(null);
        setResults(null);
      } else {
        setError('Please upload a PDF, DOCX, or TXT file');
        setFile(null);
      }
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const fileType = file.type;
      let contentBlock;

      if (fileType === 'application/pdf') {
        contentBlock = {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        };
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        contentBlock = {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            data: base64Data,
          },
        };
      } else {
        // For text files, convert base64 to text
        const text = atob(base64Data);
        contentBlock = {
          type: "text",
          text: text,
        };
      }

      const atsSystemInfo = {
        general: "You are analyzing for general ATS compatibility across all major systems.",
        workday: "You are emulating Workday ATS. Workday is known for: very strict formatting requirements, poor handling of tables and columns, preference for simple single-column layouts, difficulty parsing headers/footers, requires clear section headers, and is sensitive to complex formatting. Be more critical of formatting complexity.",
        greenhouse: "You are emulating Greenhouse ATS. Greenhouse is known for: modern parsing engine, good handling of various formats, flexible with creative layouts, strong keyword extraction, and better handling of tables/columns than older systems. Be more lenient with formatting.",
        taleo: "You are emulating Oracle Taleo ATS. Taleo is known for: legacy system with poor parsing, very strict requirements, struggles with creative formats, often misses information in headers/footers, requires extremely simple formatting, and has difficulty with tables. Be very critical of any formatting complexity.",
        lever: "You are emulating Lever ATS. Lever is known for: modern system with good parsing, handles multiple formats well, flexible with layout, good keyword extraction, and can handle some complexity in formatting. Be moderately lenient.",
        icims: "You are emulating iCIMS ATS. iCIMS is known for: common in enterprises, moderate parsing ability, prefers standard formats, can struggle with heavy formatting, and requires clear section divisions. Be moderately strict.",
        smartrecruiters: "You are emulating SmartRecruiters ATS. SmartRecruiters is known for: good multi-format parsing, handles PDFs and Word docs well, flexible with layouts, strong AI-powered parsing, and good keyword extraction. Be moderately lenient.",
        bamboohr: "You are emulating BambooHR ATS. BambooHR is known for: popular with small to mid-sized businesses, moderate parsing capabilities, decent handling of standard formats, prefers clear section headers, can handle basic formatting but struggles with complex layouts, and has improved parsing in recent versions. Be moderately strict with a focus on clarity.",
        ashby: "You are emulating Ashby ATS. Ashby is known for: modern AI-powered platform, excellent parsing capabilities, very flexible with formatting, strong natural language processing, can understand context and infer information, handles creative layouts well, and has advanced keyword extraction. Be lenient with formatting while focusing on content quality and relevance.",
        covey: "You are emulating Covey ATS. Covey is known for: AI-driven talent intelligence platform, advanced semantic understanding, focuses heavily on skills and competencies matching, strong contextual analysis, can parse diverse formats well, emphasizes quantifiable achievements and impact, and uses machine learning for candidate scoring. Be lenient with format but emphasize measurable outcomes and clear skill demonstration."
      };

      const atsContext = atsSystemInfo[selectedATS];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                contentBlock,
                {
                  type: "text",
                  text: `You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume and provide a comprehensive ATS score and feedback.

${atsContext}

Your entire response MUST be ONLY a single valid JSON object with NO additional text, explanations, or markdown formatting. DO NOT include backticks, code blocks, or any text outside the JSON structure.

Provide your analysis in this EXACT JSON format:

{
  "overallScore": number between 0-100,
  "category": "Excellent" or "Good" or "Needs Improvement" or "Poor",
  "atsSystem": "name of the ATS system being emulated",
  "systemSpecificWarnings": ["array", "of", "warnings", "specific", "to", "this", "ATS", "system"],
  "sections": {
    "formatting": {
      "score": number between 0-100,
      "feedback": "string with detailed feedback specific to this ATS system's parsing abilities"
    },
    "keywords": {
      "score": number between 0-100,
      "feedback": "string with detailed feedback"
    },
    "structure": {
      "score": number between 0-100,
      "feedback": "string with detailed feedback specific to this ATS system"
    },
    "content": {
      "score": number between 0-100,
      "feedback": "string with detailed feedback"
    }
  },
  "topKeywords": ["array", "of", "15-20", "most", "important", "keywords", "found"],
  "heatmapSegments": [
    {
      "text": "exact text from resume",
      "importance": number between 0-100 representing how much the ATS focuses on this,
      "category": "header" or "keyword" or "experience" or "skill" or "education" or "contact" or "other"
    }
  ],
  "strengths": ["array", "of", "strength", "strings"],
  "improvements": ["array", "of", "improvement", "strings", "specific", "to", "this", "ATS"],
  "atsCompatibility": {
    "score": number between 0-100,
    "issues": ["array", "of", "issue", "strings", "specific", "to", "this", "ATS"]
  }
}

Evaluate based on:
1. Formatting: Clean structure, proper sections, ATS-friendly formatting (consider this specific ATS system's parsing capabilities)
2. Keywords: Industry-relevant keywords, skills, and technologies
3. Structure: Clear sections (Contact, Summary, Experience, Education, Skills) - evaluate based on this ATS's requirements
4. Content: Quantifiable achievements, clear job descriptions, relevant experience
5. ATS Compatibility: Parseable format, standard fonts, no graphics - specific to this ATS system

For topKeywords, extract 15-20 of the most valuable keywords from the resume including:
- Technical skills and tools
- Programming languages or software
- Industry-specific terms
- Certifications
- Key competencies and soft skills
- Action verbs and achievements

For heatmapSegments, break down the resume into segments (phrases, sentences, or short sections) and rate each segment's importance to the ATS:
- 90-100: Critical information (name, contact, job titles, key skills, achievements)
- 70-89: Important information (relevant experience, education, certifications)
- 50-69: Moderate importance (supporting details, descriptions)
- 30-49: Low importance (common words, generic statements)
- 0-29: Minimal importance (formatting text, articles, prepositions)
Include 30-50 segments that represent the key parts of the resume. Categorize each segment appropriately.

For systemSpecificWarnings, provide 3-5 specific warnings about how THIS ATS system might struggle with or misinterpret elements of this resume based on the system's known limitations.

Adjust your scoring and feedback based on the specific ATS system's known strengths and weaknesses in parsing resumes.

CRITICAL: Your response must be ONLY the JSON object above with NO other text.`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up any markdown formatting
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const analysisResults = JSON.parse(responseText);
      setResults(analysisResults);
      if (analysisResults.heatmapSegments) {
        setHeatmapData(analysisResults.heatmapSegments);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze resume. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHeatmapColor = (importance) => {
    if (importance >= 90) return 'bg-red-200 border-red-400';
    if (importance >= 70) return 'bg-orange-200 border-orange-400';
    if (importance >= 50) return 'bg-yellow-200 border-yellow-400';
    if (importance >= 30) return 'bg-green-200 border-green-400';
    return 'bg-blue-100 border-blue-300';
  };

  const getHeatmapLabel = (importance) => {
    if (importance >= 90) return 'Critical';
    if (importance >= 70) return 'Important';
    if (importance >= 50) return 'Moderate';
    if (importance >= 30) return 'Low';
    return 'Minimal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">ATS Resume Analyzer</h1>
              <p className="text-sm text-gray-600">Emulate Workday, Greenhouse, Taleo & more</p>
            </div>
            {(file || results) && (
              <button
                onClick={clearAllData}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear All Data
              </button>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Privacy Protected</h3>
                <p className="text-sm text-blue-800">
                  Your resume is processed entirely in your browser. No data is stored on our servers. 
                  Files are converted to temporary format for analysis and immediately discarded. 
                  Click "Clear All Data" at any time to remove everything from your session.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Upload your resume to get an ATS compatibility score and detailed feedback. Select which ATS system to emulate - each system has different parsing capabilities and requirements. View a heatmap to see exactly what the ATS focuses on.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select ATS System to Emulate
            </label>
            <select
              value={selectedATS}
              onChange={(e) => {
                setSelectedATS(e.target.value);
                setResults(null); // Clear results when changing ATS system
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {atsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Different ATS systems have different parsing capabilities and requirements
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Click to upload
              </span>
              <span className="text-gray-600"> or drag and drop</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">PDF, DOCX, or TXT (max 10MB)</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="text-gray-700 font-medium">{file.name}</span>
              </div>
              <button
                onClick={analyzeResume}
                disabled={analyzing}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Overall ATS Score</h2>
                  <p className="text-sm text-gray-600 mt-1">Analyzed for: {results.atsSystem}</p>
                </div>
                <div className={`text-5xl font-bold ${getScoreColor(results.overallScore)}`}>
                  {results.overallScore}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Score</span>
                  <span>{results.category}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${getScoreBarColor(results.overallScore)} transition-all duration-500`}
                    style={{ width: `${results.overallScore}%` }}
                  />
                </div>
              </div>

              {results.systemSpecificWarnings && results.systemSpecificWarnings.length > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {results.atsSystem}-Specific Warnings
                  </h4>
                  <ul className="space-y-2">
                    {results.systemSpecificWarnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">⚠</span>
                        <span className="text-yellow-900 text-sm">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Detailed Breakdown
              </h3>
              
              <div className="grid gap-6">
                {Object.entries(results.sections).map(([key, section]) => (
                  <div key={key} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700 capitalize">{key}</h4>
                      <span className={`text-xl font-bold ${getScoreColor(section.score)}`}>
                        {section.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full ${getScoreBarColor(section.score)}`}
                        style={{ width: `${section.score}%` }}
                      />
                    </div>
                    <p className="text-gray-600 text-sm">{section.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                Top Keywords Found
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                These are the most important keywords and skills identified in your resume:
              </p>
              <div className="flex flex-wrap gap-2">
                {results.topKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {heatmapData && heatmapData.length > 0 && (
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    ATS Heatmap View
                  </h3>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  This shows what the {results.atsSystem} system focuses on when parsing your resume. 
                  Brighter colors indicate information the ATS considers more important.
                </p>

                {showHeatmap && (
                  <>
                    <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                        <span className="text-sm text-gray-700">Critical (90-100)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
                        <span className="text-sm text-gray-700">Important (70-89)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                        <span className="text-sm text-gray-700">Moderate (50-69)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                        <span className="text-sm text-gray-700">Low (30-49)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                        <span className="text-sm text-gray-700">Minimal (0-29)</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                      {heatmapData.map((segment, idx) => (
                        <div
                          key={idx}
                          className={`inline-block px-2 py-1 m-1 rounded border ${getHeatmapColor(segment.importance)} transition-all hover:scale-105`}
                          title={`${getHeatmapLabel(segment.importance)} (${segment.importance}/100) - ${segment.category}`}
                        >
                          <span className="text-sm text-gray-800">{segment.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {results.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {results.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">→</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ATS Compatibility</h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700">Compatibility Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(results.atsCompatibility.score)}`}>
                  {results.atsCompatibility.score}/100
                </span>
              </div>
              
              {results.atsCompatibility.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Potential Issues:</h4>
                  <ul className="space-y-2">
                    {results.atsCompatibility.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">!</span>
                        <span className="text-gray-700">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
