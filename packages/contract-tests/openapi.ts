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

type OpenApiDocument = {
	paths?: Record<string, Record<string, OpenApiOperation>>;
};

const ajv = new Ajv({
	allErrors: true,
	strict: false,
});

addFormats(ajv);

export async function loadOpenApiSpec(path: string): Promise<OpenApiDocument> {
	return (await $RefParser.dereference(path)) as OpenApiDocument;
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
