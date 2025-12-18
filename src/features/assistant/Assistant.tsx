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
import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper, IconButton, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { assistantService } from '@services/assistant.service';

type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string };

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'sys-1', role: 'system', content: 'Welcome to UIDAM Assistant! Ask about users, accounts, roles, scopes, clients and policies.'
  }]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false); // guard to avoid double start in StrictMode

  useEffect(() => {
    // React 18 StrictMode in dev mounts/unmounts twice; guard to avoid double session starts
    if (mountedRef.current) return;
    mountedRef.current = true;
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startSession = async () => {
    try {
      const res = await assistantService.startSession();
      setSessionId(res.sessionId);
      addSystemMessage('New session started');
    } catch (e) {
      addSystemMessage('Could not start session. Ensure agent server is running at port 9000.');
    }
  };

  const endSession = async () => {
    try {
      await assistantService.endSession();
      setSessionId(null);
      setMessages([{ id: 'sys-1', role: 'system', content: 'Session ended. Start a new session to continue.' }]);
    } catch (e) {
      addSystemMessage('Could not end session.');
    }
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const reply = await assistantService.sendMessage(trimmed);
      const assistantMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: reply };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      addSystemMessage('Error: could not get response from agent.');
    } finally {
      setIsLoading(false);
      // small delay for typing indicator realism
      setTimeout(() => setIsTyping(false), 250);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter without Shift = send message
    // Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const addSystemMessage = (text: string) => {
    // Avoid adding identical system messages repeatedly
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last && last.role === 'system' && last.content === text) return m;
      return [...m, { id: `s-${Date.now()}`, role: 'system', content: text }];
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>A</Avatar>
        <Box>
          <Typography variant="h6">UIDAM Assistant</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sessionId ? `Session: ${sessionId.substring(0,8)}...` : 'No Session'}</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<RefreshIcon />} onClick={() => { setMessages([{ id: 'sys-1', role: 'system', content: 'New session starting...' }]); startSession(); }} size="small">New</Button>
        <Button startIcon={<CloseIcon />} onClick={endSession} size="small">End</Button>
        <Button onClick={() => setMessages([{ id: 'sys-1', role: 'system', content: 'Welcome to UIDAM Assistant! Ask about users, accounts, roles, scopes, clients and policies.' }])} size="small">Clear</Button>
      </Box>

      <Paper variant="outlined" sx={{ flex: 1, p: 2, overflow: 'auto', mb: 2, display: 'flex', flexDirection: 'column' }}>
        {messages.map((m) => {
          const getBackgroundColor = () => {
            if (m.role === 'user') return 'primary.main';
            if (m.role === 'system') return 'warning.light';
            return 'background.paper';
          };
          
          const backgroundColor = getBackgroundColor();
          const textColor = m.role === 'user' ? 'primary.contrastText' : 'text.primary';
          
          return (
            <Box key={m.id} sx={{ mb: 1, display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {m.role !== 'user' && (
                <Avatar sx={{ width: 36, height: 36, mr: 1, bgcolor: m.role === 'system' ? 'warning.main' : 'grey.200' }}>
                  {m.role === 'assistant' ? 'A' : 'S'}
                </Avatar>
              )}
              <Paper sx={{ p: 1.5, maxWidth: '78%', backgroundColor, color: textColor, fontSize: '0.98rem', lineHeight: 1.5, boxShadow: 1 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', textAlign: 'right' }}>{new Date(parseInt(m.id.split('-').slice(-1)[0]) || Date.now()).toLocaleTimeString()}</Typography>
              </Paper>
              {m.role === 'user' && (
                <Avatar sx={{ width: 36, height: 36, ml: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>U</Avatar>
              )}
            </Box>
          );
        })}

        {isTyping && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.200' }}>A</Avatar>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <CircularProgress size={8} sx={{ color: 'text.secondary' }} />
              <CircularProgress size={8} sx={{ color: 'text.secondary' }} />
              <CircularProgress size={8} sx={{ color: 'text.secondary' }} />
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      <Box component="form" onSubmit={(e) => { e.preventDefault(); send(); }} sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          placeholder="Ask me about UIDAM operations... (Shift+Enter for new line, Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          size="small"
          inputProps={{ 'aria-label': 'Assistant input' }}
          sx={{
            '& .MuiInputBase-root': {
              alignItems: 'flex-end',
              paddingRight: '8px',
            },
          }}
        />
        <IconButton color="primary" onClick={send} disabled={isLoading || !input.trim()} type="submit" aria-label="Send message">
          {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Assistant;
