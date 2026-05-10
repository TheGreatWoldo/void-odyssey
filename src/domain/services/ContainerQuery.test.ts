import { describe, expect, it } from 'vitest';

import { createResource, ResourceType } from '@/domain/models/resources/resource';
import { createResourceContainer } from '@/domain/models/resources/resource-container';
import { containersHolding, hasTotalOf, totalOf } from './ContainerQuery';

function makeContainer(capacity = 100) {
  return createResourceContainer({ capacity });
}

function fuel(amount: number) {
  return createResource(ResourceType.Fuel, amount);
}

function food(amount: number) {
  return createResource(ResourceType.Food, amount);
}

describe('ContainerQuery', () => {
  describe('totalOf', () => {
    it('returns 0 when no containers are provided', () => {
      expect(totalOf(ResourceType.Fuel, [])).toBe(0);
    });

    it('returns 0 when containers hold no resources', () => {
      const a = makeContainer();
      const b = makeContainer();

      expect(totalOf(ResourceType.Fuel, [a, b])).toBe(0);
    });

    it('sums a resource across multiple root containers', () => {
      const a = makeContainer();
      const b = makeContainer();
      a.add(fuel(3));
      b.add(fuel(5));

      expect(totalOf(ResourceType.Fuel, [a, b])).toBe(8);
    });

    it('includes resources in nested child containers', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      child.add(fuel(4));
      parent.addContainer(child);

      expect(totalOf(ResourceType.Fuel, [parent])).toBe(4);
    });

    it('sums resources across both parent and nested child', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      parent.add(fuel(2));
      child.add(fuel(4));
      parent.addContainer(child);

      expect(totalOf(ResourceType.Fuel, [parent])).toBe(6);
    });

    it('recurses through multiple levels of nesting', () => {
      const grandparent = makeContainer();
      const parent = makeContainer(50);
      const child = makeContainer(20);
      child.add(fuel(1));
      parent.add(fuel(2));
      parent.addContainer(child);
      grandparent.addContainer(parent);

      expect(totalOf(ResourceType.Fuel, [grandparent])).toBe(3);
    });

    it('only counts the queried resource type', () => {
      const a = makeContainer();
      a.add(fuel(5));
      a.add(food(10));

      expect(totalOf(ResourceType.Fuel, [a])).toBe(5);
      expect(totalOf(ResourceType.Food, [a])).toBe(10);
    });
  });

  describe('containersHolding', () => {
    it('returns an empty array when no containers hold the resource', () => {
      const a = makeContainer();
      const b = makeContainer();

      expect(containersHolding(ResourceType.Fuel, [a, b])).toHaveLength(0);
    });

    it('returns only containers that hold the resource', () => {
      const a = makeContainer();
      const b = makeContainer();
      a.add(fuel(3));

      const result = containersHolding(ResourceType.Fuel, [a, b]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(a);
    });

    it('includes nested containers that hold the resource', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      child.add(fuel(5));
      parent.addContainer(child);

      const result = containersHolding(ResourceType.Fuel, [parent]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(child);
    });

    it('returns both parent and child when both hold the resource', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      parent.add(fuel(2));
      child.add(fuel(5));
      parent.addContainer(child);

      const result = containersHolding(ResourceType.Fuel, [parent]);

      expect(result).toHaveLength(2);
      expect(result).toContain(parent);
      expect(result).toContain(child);
    });
  });

  describe('hasTotalOf', () => {
    it('returns false when containers are empty', () => {
      const a = makeContainer();

      expect(hasTotalOf(ResourceType.Fuel, 1, [a])).toBe(false);
    });

    it('returns true when total exactly meets the required amount', () => {
      const a = makeContainer();
      a.add(fuel(3));

      expect(hasTotalOf(ResourceType.Fuel, 3, [a])).toBe(true);
    });

    it('returns true when total exceeds the required amount', () => {
      const a = makeContainer();
      a.add(fuel(10));

      expect(hasTotalOf(ResourceType.Fuel, 5, [a])).toBe(true);
    });

    it('returns false when total is below the required amount', () => {
      const a = makeContainer();
      a.add(fuel(2));

      expect(hasTotalOf(ResourceType.Fuel, 5, [a])).toBe(false);
    });

    it('spans multiple containers to meet the required amount', () => {
      const a = makeContainer();
      const b = makeContainer();
      a.add(fuel(3));
      b.add(fuel(3));

      expect(hasTotalOf(ResourceType.Fuel, 6, [a, b])).toBe(true);
      expect(hasTotalOf(ResourceType.Fuel, 7, [a, b])).toBe(false);
    });

    it('counts resources in nested containers toward the total', () => {
      const parent = makeContainer();
      const child = makeContainer(20);
      child.add(fuel(4));
      parent.addContainer(child);

      expect(hasTotalOf(ResourceType.Fuel, 4, [parent])).toBe(true);
    });
  });
});
