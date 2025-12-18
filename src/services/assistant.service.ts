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
import { userManagementApi } from './api-client';

export interface SessionResponse {
  sessionId: string;
}

export class AssistantService {
  async startSession(): Promise<SessionResponse> {
    return userManagementApi.post('/session/start');
  }

  async endSession(): Promise<string> {
    return userManagementApi.post('/session/end');
  }

  async sendMessage(message: string): Promise<string> {
    // Agent expects { message } in POST body
    return userManagementApi.post('/chat', { message });
  }
}

export const assistantService = new AssistantService();
