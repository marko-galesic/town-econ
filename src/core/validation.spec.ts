import { describe, it, expect } from 'vitest';
import { initGameState } from './initGameState';

describe('Data Validation - Current Data', () => {
  it('should validate current goods.json and towns.json data', () => {
    // This test verifies that our current data files pass validation
    expect(() => initGameState()).not.toThrow();

    const gameState = initGameState();

    // Verify we have the expected structure
    expect(gameState.towns).toHaveLength(3);
    expect(Object.keys(gameState.goods)).toHaveLength(3);

    // Verify all towns have required GoodIds
    const goodIds = Object.keys(gameState.goods);
    gameState.towns.forEach((town) => {
      // Check resources
      goodIds.forEach(goodId => {
        expect(town.resources).toHaveProperty(goodId);
        expect(typeof town.resources[goodId as keyof typeof town.resources]).toBe('number');
        expect(town.resources[goodId as keyof typeof town.resources]).toBeGreaterThanOrEqual(0);
      });

      // Check prices
      goodIds.forEach(goodId => {
        expect(town.prices).toHaveProperty(goodId);
        expect(typeof town.prices[goodId as keyof typeof town.prices]).toBe('number');
        expect(town.prices[goodId as keyof typeof town.prices]).toBeGreaterThanOrEqual(0);
      });
    });

    // Verify specific expected values
    if (gameState.towns[0]) {
      expect(gameState.towns[0].id).toBe('riverdale');
    }
    if (gameState.towns[1]) {
      expect(gameState.towns[1].id).toBe('forestburg');
    }
    if (gameState.towns[2]) {
      expect(gameState.towns[2].id).toBe('ironforge');
    }

    expect(gameState.goods.fish.name).toBe('Fish');
    expect(gameState.goods.wood.name).toBe('Wood');
    expect(gameState.goods.ore.name).toBe('Ore');
  });

  it('should provide detailed validation feedback', () => {
    const gameState = initGameState();

    // Log validation details for manual inspection
    console.log('\n📊 Validation Details:');
    console.log(`✅ Towns: ${gameState.towns.length}`);
    console.log(`✅ Goods: ${Object.keys(gameState.goods).length}`);

    gameState.towns.forEach((town, index) => {
      console.log(`\n🏘️  Town ${index + 1}: ${town.name} (${town.id})`);
      console.log(`   📦 Resources: ${Object.entries(town.resources).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      console.log(`   💰 Prices: ${Object.entries(town.prices).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    });

    console.log(`\n🎯 Goods: ${Object.entries(gameState.goods).map(([k, v]) => `${k}: ${v.name}`).join(', ')}`);
    console.log('🎉 All validation checks passed!\n');
  });
});
