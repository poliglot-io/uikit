import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get package version from our own package.json
function getPackageVersion(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkgPath = join(__dirname, "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*"]
}
`;

const INDEX_TS = `export { default as PersonCard } from './PersonCard';
`;

const PERSON_CARD_TSX = `import { Card, CardHeader, CardTitle, CardContent } from "@poliglot-io/uikit";

interface Props {
  name: string;
  email?: string;
}

export default function PersonCard({ name, email }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      {email && (
        <CardContent>
          <p>{email}</p>
        </CardContent>
      )}
    </Card>
  );
}
`;

function generatePackageJson(name: string, version: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      type: "module",
      dependencies: {
        "@poliglot-io/uikit": `^${version}`,
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        typescript: "^5.0.0",
      },
    },
    null,
    2
  );
}

function generateUiTtl(uriPrefix: string): string {
  return `@prefix : <${uriPrefix}> .
@prefix plgt-ui: <https://poliglot.io/os/spec/ui#> .
@prefix plgt: <https://poliglot.io/os/spec#> .

:PersonView a plgt-ui:Renderable ;
    plgt-ui:forType :Person ;
    plgt-ui:component :PersonCardComponent ;
    plgt-ui:propsQuery [
        a plgt:JSONFunction ;
        plgt:fromJSON """
        JSON { "name": ?name, "email": ?email }
        WHERE {
            ?subject :name ?name .
            OPTIONAL { ?subject :email ?email }
        }
        """
    ] .
`;
}

export interface InitOptions {
  name: string;
  uriPrefix: string;
  specDir?: string;
  componentsDir?: string;
}

export async function init(
  projectRoot: string,
  options: InitOptions
): Promise<void> {
  const version = getPackageVersion();
  const specDir = options.specDir || "spec";
  const componentsDir = options.componentsDir || "src/components";

  // Create directories
  const specPath = join(projectRoot, specDir);
  const componentsPath = join(projectRoot, componentsDir);

  mkdirSync(specPath, { recursive: true });
  console.log(`✓ Created ${specDir}/`);

  mkdirSync(componentsPath, { recursive: true });
  console.log(`✓ Created ${componentsDir}/`);

  // Create package.json
  const packageJsonPath = join(projectRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    writeFileSync(packageJsonPath, generatePackageJson(options.name, version));
    console.log("✓ Created package.json");
  }

  // Create tsconfig.json
  const tsconfigPath = join(projectRoot, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    writeFileSync(tsconfigPath, TSCONFIG);
    console.log("✓ Created tsconfig.json");
  }

  // Create component files
  const indexPath = join(componentsPath, "index.ts");
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, INDEX_TS);
    console.log(`✓ Created ${componentsDir}/index.ts`);
  }

  const personCardPath = join(componentsPath, "PersonCard.tsx");
  if (!existsSync(personCardPath)) {
    writeFileSync(personCardPath, PERSON_CARD_TSX);
    console.log(`✓ Created ${componentsDir}/PersonCard.tsx`);
  }

  // Create ui.ttl
  const uiTtlPath = join(specPath, "ui.ttl");
  if (!existsSync(uiTtlPath)) {
    writeFileSync(uiTtlPath, generateUiTtl(options.uriPrefix));
    console.log(`✓ Created ${specDir}/ui.ttl`);
  }

  console.log("\nUI components initialized.");
}
