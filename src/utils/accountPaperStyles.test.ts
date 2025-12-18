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
import { getAccountPaperStyles, AccountSelectionState } from './accountPaperStyles';

describe('getAccountPaperStyles', () => {
  it('should return default styles for unselected account', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: false,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    expect(styles).toMatchObject({
      p: 2,
      mb: 2,
      border: '1px solid #e0e0e0',
      bgcolor: '#f9f9f9',
      opacity: 0.7,
    });
  });

  it('should return selected styles for selected account', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: true,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    expect(styles).toMatchObject({
      p: 2,
      mb: 2,
      border: '2px solid #2196f3',
      bgcolor: '#e3f2fd',
      opacity: 1,
    });
  });

  it('should return default account styles for selected default account', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: true,
      isDefaultAccount: true,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    expect(styles).toMatchObject({
      p: 2,
      mb: 2,
      border: '2px solid #4caf50',
      bgcolor: '#f1f8e9',
      opacity: 1,
    });
  });

  it('should handle default account flag when not selected', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: false,
      isDefaultAccount: true,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    // Default account flag should only affect styling when selected
    expect(styles).toMatchObject({
      p: 2,
      mb: 2,
      border: '1px solid #e0e0e0',
      bgcolor: '#f9f9f9',
      opacity: 0.7,
    });
  });

  it('should have consistent padding and margin across all states', () => {
    const states: AccountSelectionState[] = [
      { isAccountSelected: false },
      { isAccountSelected: true },
      { isAccountSelected: true, isDefaultAccount: true },
      { isAccountSelected: false, isDefaultAccount: true },
    ];

    states.forEach((mapping) => {
      const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;
      expect(styles.p).toBe(2);
      expect(styles.mb).toBe(2);
    });
  });

  it('should use blue theme for selected non-default accounts', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: true,
      isDefaultAccount: false,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    expect(styles.border).toBe('2px solid #2196f3');
    expect(styles.bgcolor).toBe('#e3f2fd');
  });

  it('should use green theme for selected default accounts', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: true,
      isDefaultAccount: true,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    expect(styles.border).toBe('2px solid #4caf50');
    expect(styles.bgcolor).toBe('#f1f8e9');
  });

  it('should have thicker border for selected accounts', () => {
    const unselected: AccountSelectionState = { isAccountSelected: false };
    const selected: AccountSelectionState = { isAccountSelected: true };

    const unselectedStyles = getAccountPaperStyles(unselected) as Record<string, unknown>;
    const selectedStyles = getAccountPaperStyles(selected) as Record<string, unknown>;

    expect(unselectedStyles.border).toContain('1px');
    expect(selectedStyles.border).toContain('2px');
  });

  it('should have full opacity for selected accounts', () => {
    const selected: AccountSelectionState = { isAccountSelected: true };
    const selectedDefault: AccountSelectionState = {
      isAccountSelected: true,
      isDefaultAccount: true,
    };

    const selectedStyles = getAccountPaperStyles(selected) as Record<string, unknown>;
    const selectedDefaultStyles = getAccountPaperStyles(selectedDefault) as Record<string, unknown>;

    expect(selectedStyles.opacity).toBe(1);
    expect(selectedDefaultStyles.opacity).toBe(1);
  });

  it('should have reduced opacity for unselected accounts', () => {
    const unselected: AccountSelectionState = { isAccountSelected: false };

    const styles = getAccountPaperStyles(unselected) as Record<string, unknown>;

    expect(styles.opacity).toBe(0.7);
  });

  it('should return SxProps type compatible object', () => {
    const mapping: AccountSelectionState = {
      isAccountSelected: true,
    };

    const styles = getAccountPaperStyles(mapping) as Record<string, unknown>;

    // Verify the returned object has the expected structure
    expect(styles).toHaveProperty('p');
    expect(styles).toHaveProperty('mb');
    expect(styles).toHaveProperty('border');
    expect(styles).toHaveProperty('bgcolor');
    expect(styles).toHaveProperty('opacity');
  });
});
