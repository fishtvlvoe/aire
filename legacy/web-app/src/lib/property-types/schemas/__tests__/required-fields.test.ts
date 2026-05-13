import { describe, expect, test } from 'vitest';

import { apartmentSchema } from '../apartment';
import { highriseSchema } from '../highrise';
import { suiteSchema } from '../suite';
import { townhouseSchema } from '../townhouse';
import { shopSchema } from '../shop';
import { factorySchema } from '../factory';
import { farmhouseSchema } from '../farmhouse';
import { farmlandSchema } from '../farmland';
import { residentialLandSchema } from '../residential-land';
import { industrialLandSchema } from '../industrial-land';
import { commercialLandSchema } from '../commercial-land';
import { ruralLandSchema } from '../rural-land';
import { otherLandSchema } from '../other-land';

type SchemaField = {
  key: string;
  required?: boolean;
  type?: string;
};

type PropertySchema = {
  common?: SchemaField[];
  building_common?: SchemaField[];
  land_common?: SchemaField[];
  media?: SchemaField[];
};

const findField = (fields: SchemaField[] | undefined, key: string) =>
  fields?.find((f) => f.key === key);

describe('property schema required fields (legal disclosure)', () => {
  const schemas: ReadonlyArray<readonly [string, PropertySchema]> = [
    ['apartment', apartmentSchema as PropertySchema],
    ['highrise', highriseSchema as PropertySchema],
    ['suite', suiteSchema as PropertySchema],
    ['townhouse', townhouseSchema as PropertySchema],
    ['shop', shopSchema as PropertySchema],
    ['factory', factorySchema as PropertySchema],
    ['farmhouse', farmhouseSchema as PropertySchema],
    ['farmland', farmlandSchema as PropertySchema],
    ['residential-land', residentialLandSchema as PropertySchema],
    ['industrial-land', industrialLandSchema as PropertySchema],
    ['commercial-land', commercialLandSchema as PropertySchema],
    ['rural-land', ruralLandSchema as PropertySchema],
    ['other-land', otherLandSchema as PropertySchema],
  ];

  const commonRequiredKeys = [
    'ownership_scope',
    'other_rights',
    'restriction_records',
    'public_acquisition',
    'nearby_facilities',
  ] as const;

  test.each(schemas)('%s: common has legal disclosure required fields', (_name, schema) => {
    for (const key of commonRequiredKeys) {
      const field = findField(schema.common, key);
      expect(field, `missing schema.common field: ${key}`).toBeTruthy();
      expect(field?.required, `schema.common.${key} should be required`).toBe(true);
    }
  });

  const buildingSchemas: ReadonlyArray<readonly [string, PropertySchema]> = [
    ['apartment', apartmentSchema as PropertySchema],
    ['highrise', highriseSchema as PropertySchema],
    ['suite', suiteSchema as PropertySchema],
    ['townhouse', townhouseSchema as PropertySchema],
    ['shop', shopSchema as PropertySchema],
    ['factory', factorySchema as PropertySchema],
    ['farmhouse', farmhouseSchema as PropertySchema],
  ];

  test.each(buildingSchemas)('%s: building_common has disclosure fields', (_name, schema) => {
    const nonNaturalDeath = findField(schema.building_common, 'non_natural_death');
    expect(nonNaturalDeath, 'missing non_natural_death').toBeTruthy();
    expect(nonNaturalDeath?.required).toBe(true);

    const leakDamage = findField(schema.building_common, 'leak_damage');
    expect(leakDamage, 'missing leak_damage').toBeTruthy();
    expect(leakDamage?.required).toBe(true);

    const chlorideRadiation = findField(schema.building_common, 'chloride_radiation');
    expect(chlorideRadiation, 'missing chloride_radiation').toBeTruthy();
    expect(chlorideRadiation?.required ?? false).toBe(false);
  });

  const landSchemas: ReadonlyArray<readonly [string, PropertySchema]> = [
    ['farmland', farmlandSchema as PropertySchema],
    ['residential-land', residentialLandSchema as PropertySchema],
    ['industrial-land', industrialLandSchema as PropertySchema],
    ['commercial-land', commercialLandSchema as PropertySchema],
    ['rural-land', ruralLandSchema as PropertySchema],
    ['other-land', otherLandSchema as PropertySchema],
  ];

  test.each(landSchemas)('%s: land_common has legal disclosure required fields', (_name, schema) => {
    const zoning = findField(schema.land_common, 'zoning');
    expect(zoning, 'missing zoning').toBeTruthy();
    expect(zoning?.required).toBe(true);

    const bcr = findField(schema.land_common, 'building_coverage_ratio');
    expect(bcr, 'missing building_coverage_ratio').toBeTruthy();
    expect(bcr?.required).toBe(true);

    const far = findField(schema.land_common, 'floor_area_ratio');
    expect(far, 'missing floor_area_ratio').toBeTruthy();
    expect(far?.required).toBe(true);
  });

  test('farmhouse: land_common includes building_coverage_ratio and floor_area_ratio', () => {
    const schema = farmhouseSchema as PropertySchema;
    expect(findField(schema.land_common, 'building_coverage_ratio')).toBeTruthy();
    expect(findField(schema.land_common, 'floor_area_ratio')).toBeTruthy();
  });

  test.each(schemas)('%s: media includes photos file', (_name, schema) => {
    const photos = findField(schema.media, 'photos');
    expect(photos, 'missing photos').toBeTruthy();
    expect(photos?.type).toBe('file');
  });
});
