import path from 'node:path';

import $RefParser from '@apidevtools/json-schema-ref-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

type OpenApiResponse = {
	content?: Record<
		string,
		{
			schema?: object;
		}
	>;
};

type OpenApiOperation = {
	responses?: Record<string, OpenApiResponse>;
};

export type OpenApiDocument = {
	paths?: Record<string, Record<string, OpenApiOperation>>;
	components?: { schemas?: Record<string, object> };
};

const ajv = new Ajv({
	allErrors: true,
	strict: false,
});

addFormats(ajv);

const schemaCache = new Map<string, Map<string, ReturnType<typeof ajv.compile>>>();

function getCompiledSchema(
	spec: OpenApiDocument,
	schemaName: string,
): ReturnType<typeof ajv.compile> {
	const specSchemas = spec.components?.schemas;
	if (!specSchemas) {
		throw new Error('No components.schemas found in spec');
	}

	const cacheKey = JSON.stringify(spec);
	if (!schemaCache.has(cacheKey)) {
		schemaCache.set(cacheKey, new Map());
	}
	const cached = schemaCache.get(cacheKey)!;

	if (cached.has(schemaName)) {
		return cached.get(schemaName)!;
	}

	const schema = specSchemas[schemaName];
	if (!schema) {
		throw new Error(`Schema '${schemaName}' not found in spec`);
	}

	const validate = ajv.compile(schema);
	cached.set(schemaName, validate);
	return validate;
}

export async function loadOpenApiSpec(filePath: string): Promise<OpenApiDocument> {
	return (await $RefParser.dereference(filePath)) as OpenApiDocument;
}

export function validateAgainstSchema(
	spec: OpenApiDocument,
	schemaName: string,
	data: unknown,
): void {
	const validate = getCompiledSchema(spec, schemaName);
	if (!validate(data)) {
		throw new Error(
			`Schema '${schemaName}' validation failed:\n${JSON.stringify(validate.errors, null, 2)}`,
		);
	}
}

export function validateOpenApiResponse(
	spec: OpenApiDocument,
	method: string,
	route: string,
	statusCode: number,
	body: unknown,
): void {
	const operation = spec.paths?.[route]?.[method.toLowerCase()];

	if (!operation) {
		throw new Error(`No OpenAPI operation found for ${method.toUpperCase()} ${route}`);
	}

	const response = operation.responses?.[String(statusCode)] ?? operation.responses?.default;

	if (!response) {
		throw new Error(
			`No OpenAPI response defined for ${method.toUpperCase()} ${route} (${statusCode})`,
		);
	}

	const schema = response.content?.['application/json']?.schema;

	if (!schema) {
		return;
	}

	const validate = ajv.compile(schema);

	if (!validate(body)) {
		throw new Error(
			`Response failed OpenAPI validation:\n${JSON.stringify(validate.errors, null, 2)}`,
		);
	}
}

export function getServiceSpecPath(serviceName: string): string {
	const file = serviceName + '.yaml';
	if (!file) throw new Error(`Unknown service: ${serviceName}`);
	return path.resolve(process.cwd(), '../../docs/openapi', file);
}
