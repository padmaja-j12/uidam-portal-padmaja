/********************************************************************************
* Copyright (c) 2025 Harman International
*
* <p>Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* <p>http://www.apache.org/licenses/LICENSE-2.0  
*
* <p> Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* <p>SPDX-License-Identifier: Apache-2.0
********************************************************************************/

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig, RuntimeConfig } from './config/runtimeConfig';

const Root: React.FC = () => {
  const [configLoaded, setConfigLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuntimeConfig()
      .then((config: RuntimeConfig) => {
        // Optionally expose config globally for legacy code
        (window as any).RUNTIME_CONFIG = config;
        setConfigLoaded(true);
      })
      .catch((err) => {
        setError('Failed to load configuration.');
        // Optionally log error
        console.error('Config load error:', err);
      });
  }, []);

  if (error) {
    return <div style={{color: 'red', padding: 32}}>Error: {error}</div>;
  }
  if (!configLoaded) {
    return <div style={{padding: 32}}>Loading configuration...</div>;
  }
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
