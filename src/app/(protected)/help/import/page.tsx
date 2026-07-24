"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";

// ─── Sample CSV ───────────────────────────────────────────────────

function generateSampleCsv(): string {
  const header =
    "type,word,meaning,example_sentence,category,level,frequency_rank,fields";
  const rows = [
    ['noun', 'hello', 'سلام', '"Hello, how are you?"', 'people_relationships', 'elementary', '100', '{"plural":"hellos","gender":"masculine"}'],
    ['verb', 'go', 'رفتن', '"I go to school every day."', 'home_daily_life', 'elementary', '80', '{"is_regular":false,"present":{"i":"میروم","he_she_it":"میرود"},"past":{"i":"رفتم","he_she_it":"رفت"}}'],
    ['adjective', 'beautiful', 'زیبا', '"The sky is beautiful tonight."', 'descriptions', 'intermediate', '120', '{"comparative":"زیباتر","superlative":"زیباترین"}'],
    ['adverb', 'quickly', 'سریع', '"He quickly finished his homework."', 'manner', 'intermediate', '200', '{}'],
    ['noun', 'book', 'کتاب', '"This book is very interesting."', 'education_learning', 'elementary', '50', '{"plural":"books","gender":"inanimate"}'],
    ['verb', 'eat', 'خوردن', '"We eat lunch at noon."', 'food_dining', 'elementary', '90', '{"is_regular":true,"present":{"i":"میخورم","we":"میخوریم"},"past":{"i":"خوردم","we":"خوردیم"}}'],
    ['sentence', 'How are you?', 'حال شما چطور است؟', '""', 'people_relationships', 'elementary', '', '{"register":"formal","literal_translation":"How is your health?"}'],
    ['phrase', 'Thank you', 'متشکرم', '""', 'people_relationships', 'elementary', '', '{"register":"formal","usage_context":"polite expression of gratitude"}'],
    ['adverb', 'quickly', 'سریع', '"He quickly finished his homework."', 'manner', 'intermediate', '200', '{"adverb_type":"manner","comparative":"سریع‌تر","superlative":"سریع‌ترین"}'],
    ['pronoun', 'he', 'او', '"He is a student."', 'people_relationships', 'elementary', '10', '{"pronoun_type":"personal","person":"third","number":"singular","gender":"masculine","case":"nominative"}'],
    ['preposition', 'in', 'در', '"The book is in the bag."', 'places_environment', 'elementary', '15', '{"case_governed":"none","preposition_type":"location"}'],
  ];
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const csvRows = rows.map((r) => r.map(escape).join(","));
  return [header, ...csvRows].join("\n");
}

// ─── Markdown docs ────────────────────────────────────────────────

function generateMarkdownDocs(): string {
  return `# Import CSV Format

## Required Columns

| Column | Description |
|--------|-------------|
| \`type\` | One of: \`noun\`, \`verb\`, \`adjective\`, \`adverb\`, \`pronoun\`, \`preposition\`, \`sentence\`, \`phrase\` |
| \`word\` | The word or phrase in the target language |
| \`meaning\` | Translation in your native language |

## Optional Columns

| Column | Description |
|--------|-------------|
| \`example_sentence\` | Example sentence showing usage |
| \`category\` | Topic category (see Categories section) |
| \`level\` | Difficulty level: \`elementary\`, \`intermediate\`, \`advanced\` |
| \`frequency_rank\` | Numeric frequency rank (lower = more common) |
| \`note\` / \`notes\` | Any additional notes |
| \`fields\` | JSON string of type-specific fields (see below) |

## Type-Specific Fields (\`fields\` column)

### Noun
| Field | Type | Description |
|-------|------|-------------|
| \`plural\` | string | Plural form |
| \`gender\` | string | \`masculine\`, \`feminine\`, \`neuter\`, or \`none\` |
| \`article\` | string | Article (e.g. der, die, das, le, la) |
| \`countable\` | boolean | Whether the noun is countable |

### Verb
| Field | Type | Description |
|-------|------|-------------|
| \`is_regular\` | boolean | Whether the verb is regular |
| \`present\` | object | Present tense conjugations |
| \`past\` | object | Past tense conjugations |
| \`future\` | object | Future tense conjugations |
| \`past_participle\` | string | Past participle form |
| \`present_participle\` | string | Present participle form |
| \`prepositions\` | array | Associated prepositions |
| \`auxiliary_verb\` | string | Auxiliary verb (e.g. avoir, essere) |
| \`reflexive_pronoun\` | string | Reflexive pronoun (e.g. se, sich) |

Conjugation keys: \`i\`, \`you_sg\`, \`he_she_it\`, \`we\`, \`you_pl\`, \`they\`

### Adjective
| Field | Type | Description |
|-------|------|-------------|
| \`comparative\` | string | Comparative form |
| \`superlative\` | string | Superlative form |
| \`masculine_form\` | string | Masculine form |
| \`feminine_form\` | string | Feminine form |
| \`neuter_form\` | string | Neuter form |
| \`plural_form\` | string | Plural form |

### Adverb
| Field | Type | Description |
|-------|------|-------------|
| \`adverb_type\` | string | \`manner\`, \`time\`, \`place\`, \`frequency\`, \`degree\`, \`interrogative\`, \`relative\`, or \`other\` |
| \`comparative\` | string | Comparative form (e.g. faster, more quickly) |
| \`superlative\` | string | Superlative form (e.g. fastest, most quickly) |
| \`synonyms\` | array | List of synonyms |

### Pronoun
| Field | Type | Description |
|-------|------|-------------|
| \`pronoun_type\` | string | \`personal\`, \`possessive\`, \`reflexive\`, \`demonstrative\`, \`interrogative\`, \`relative\`, \`indefinite\`, or \`other\` |
| \`person\` | string | \`first\`, \`second\`, or \`third\` |
| \`number\` | string | \`singular\` or \`plural\` |
| \`gender\` | string | \`masculine\`, \`feminine\`, \`neuter\`, or \`none\` |
| \`case\` | string | \`nominative\`, \`accusative\`, \`dative\`, \`genitive\`, or \`none\` |
| \`formal\` | boolean | Whether the pronoun is formal (e.g. Sie vs du) |

### Preposition
| Field | Type | Description |
|-------|------|-------------|
| \`case_governed\` | string | \`accusative\`, \`dative\`, \`genitive\`, or \`none\` |
| \`preposition_type\` | string | \`location\`, \`time\`, \`direction\`, \`manner\`, \`cause\`, or \`other\` |
| \`contractions\` | object | Map of contracted forms (e.g. {"zum":"zu + dem"}) |

### Sentence
| Field | Type | Description |
|-------|------|-------------|
| \`context\` | string | Context or situation |
| \`register\` | string | \`formal\`, \`informal\`, or \`neutral\` |
| \`literal_translation\` | string | Word-for-word translation |
| \`word_by_word\` | array | Array of {word, translation} objects |

### Phrase
| Field | Type | Description |
|-------|------|-------------|
| \`usage_context\` | string | When/how to use this phrase |
| \`register\` | string | \`formal\`, \`informal\`, \`neutral\`, or \`slang\` |
| \`literal_translation\` | string | Word-for-word translation |

## Categories

| Value | Label |
|-------|-------|
| \`home_daily_life\` | Home & Daily Life |
| \`food_dining\` | Food & Dining |
| \`people_relationships\` | People & Relationships |
| \`body_health\` | Body & Health |
| \`work_money\` | Work & Money |
| \`education_learning\` | Education & Learning |
| \`travel_transport\` | Travel & Transport |
| \`places_environment\` | Places & Environment |
| \`nature_weather\` | Nature & Weather |
| \`technology_communication\` | Technology & Communication |
| \`government_law_society\` | Government, Law & Society |
| \`culture_arts_leisure\` | Culture, Arts & Leisure |
| \`sports_fitness\` | Sports & Fitness |
| \`emotions_personality\` | Emotions & Personality |
| \`thinking_communication\` | Thinking & Communication |
| \`time_numbers_measurement\` | Time, Numbers & Measurement |
| \`abstract_concepts_logic\` | Abstract Concepts & Logic |
| \`common_verbs_phrasal_verbs\` | Common Verbs & Phrasal Verbs |
| \`idioms_collocations\` | Idioms & Collocations |
| \`connectors_function_words\` | Connectors & Function Words |
| \`other\` | Other |

## Levels

| Value | Label |
|-------|-------|
| \`elementary\` | Elementary |
| \`intermediate\` | Intermediate |
| \`advanced\` | Advanced |
`;
}

// ─── Download helpers ─────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Field docs data ──────────────────────────────────────────────

const fieldDocs: {
  type: string;
  label: string;
  fields: { field: string; type: string; description: string }[];
}[] = [
  {
    type: "noun",
    label: "Noun",
    fields: [
      { field: "plural", type: "string", description: "Plural form" },
      {
        field: "gender",
        type: "string",
        description: "masculine, feminine, neuter, or none",
      },
      {
        field: "article",
        type: "string",
        description: "Article (e.g. der, die, das, le, la)",
      },
      { field: "countable", type: "boolean", description: "Countable noun" },
    ],
  },
  {
    type: "verb",
    label: "Verb",
    fields: [
      { field: "is_regular", type: "boolean", description: "Regular verb" },
      {
        field: "present",
        type: "object",
        description:
          'Present tense conjugations. Keys: i, you_sg, he_she_it, we, you_pl, they',
      },
      {
        field: "past",
        type: "object",
        description:
          'Past tense conjugations. Same keys as present.',
      },
      {
        field: "future",
        type: "object",
        description:
          'Future tense conjugations. Same keys as present.',
      },
      {
        field: "past_participle",
        type: "string",
        description: "Past participle form",
      },
      {
        field: "present_participle",
        type: "string",
        description: "Present participle form",
      },
      {
        field: "prepositions",
        type: "array",
        description: "Associated prepositions (e.g. [count_on, rely_on])",
      },
      {
        field: "auxiliary_verb",
        type: "string",
        description: "Auxiliary verb (e.g. avoir, essere)",
      },
      {
        field: "reflexive_pronoun",
        type: "string",
        description: "Reflexive pronoun (e.g. se, sich)",
      },
    ],
  },
  {
    type: "adjective",
    label: "Adjective",
    fields: [
      { field: "comparative", type: "string", description: "Comparative form" },
      { field: "superlative", type: "string", description: "Superlative form" },
      {
        field: "masculine_form",
        type: "string",
        description: "Masculine form",
      },
      {
        field: "feminine_form",
        type: "string",
        description: "Feminine form",
      },
      { field: "neuter_form", type: "string", description: "Neuter form" },
      { field: "plural_form", type: "string", description: "Plural form" },
    ],
  },
  {
    type: "adverb",
    label: "Adverb",
    fields: [
      {
        field: "adverb_type",
        type: "string",
        description: "manner, time, place, frequency, degree, interrogative, relative, or other",
      },
      { field: "comparative", type: "string", description: "Comparative form (e.g. faster, more quickly)" },
      { field: "superlative", type: "string", description: "Superlative form (e.g. fastest, most quickly)" },
      {
        field: "synonyms",
        type: "array",
        description: "List of synonyms",
      },
    ],
  },
  {
    type: "pronoun",
    label: "Pronoun",
    fields: [
      {
        field: "pronoun_type",
        type: "string",
        description: "personal, possessive, reflexive, demonstrative, interrogative, relative, indefinite, or other",
      },
      { field: "person", type: "string", description: "first, second, or third" },
      { field: "number", type: "string", description: "singular or plural" },
      { field: "gender", type: "string", description: "masculine, feminine, neuter, or none" },
      { field: "case", type: "string", description: "nominative, accusative, dative, genitive, or none" },
      { field: "formal", type: "boolean", description: "Whether the pronoun is formal (e.g. Sie vs du)" },
    ],
  },
  {
    type: "preposition",
    label: "Preposition",
    fields: [
      { field: "case_governed", type: "string", description: "accusative, dative, genitive, or none" },
      {
        field: "preposition_type",
        type: "string",
        description: "location, time, direction, manner, cause, or other",
      },
      {
        field: "contractions",
        type: "object",
        description: 'Map of contracted forms (e.g. {"zum":"zu + dem","zur":"zu + der"})',
      },
    ],
  },
  {
    type: "sentence",
    label: "Sentence",
    fields: [
      {
        field: "context",
        type: "string",
        description: "Context or situation",
      },
      {
        field: "register",
        type: "string",
        description: "formal, informal, or neutral",
      },
      {
        field: "literal_translation",
        type: "string",
        description: "Word-for-word translation",
      },
      {
        field: "word_by_word",
        type: "array",
        description:
          "Array of {word, translation} objects for each word",
      },
    ],
  },
  {
    type: "phrase",
    label: "Phrase",
    fields: [
      {
        field: "usage_context",
        type: "string",
        description: "When/how to use this phrase",
      },
      {
        field: "register",
        type: "string",
        description: "formal, informal, neutral, or slang",
      },
      {
        field: "literal_translation",
        type: "string",
        description: "Word-for-word translation",
      },
    ],
  },
];

const CATEGORIES = [
  { value: "home_daily_life", label: "Home & Daily Life" },
  { value: "food_dining", label: "Food & Dining" },
  { value: "people_relationships", label: "People & Relationships" },
  { value: "body_health", label: "Body & Health" },
  { value: "work_money", label: "Work & Money" },
  { value: "education_learning", label: "Education & Learning" },
  { value: "travel_transport", label: "Travel & Transport" },
  { value: "places_environment", label: "Places & Environment" },
  { value: "nature_weather", label: "Nature & Weather" },
  { value: "technology_communication", label: "Technology & Communication" },
  { value: "government_law_society", label: "Government, Law & Society" },
  { value: "culture_arts_leisure", label: "Culture, Arts & Leisure" },
  { value: "sports_fitness", label: "Sports & Fitness" },
  { value: "emotions_personality", label: "Emotions & Personality" },
  { value: "thinking_communication", label: "Thinking & Communication" },
  { value: "time_numbers_measurement", label: "Time, Numbers & Measurement" },
  { value: "abstract_concepts_logic", label: "Abstract Concepts & Logic" },
  { value: "common_verbs_phrasal_verbs", label: "Common Verbs & Phrasal Verbs" },
  { value: "idioms_collocations", label: "Idioms & Collocations" },
  { value: "connectors_function_words", label: "Connectors & Function Words" },
  { value: "other", label: "Other" },
];

const LEVELS = [
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

// ─── Component ────────────────────────────────────────────────────

export default function ImportHelpPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vocabulary">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Guide</h1>
          <p className="text-sm text-muted-foreground">
            How to import vocabulary via CSV
          </p>
        </div>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Import vocabulary in bulk using a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              <span className="font-medium">Prepare</span> a CSV file with your
              vocabulary data (use the sample template below)
            </li>
            <li>
              <span className="font-medium">Go to</span> the{" "}
              <Link
                href="/vocabulary"
                className="underline underline-offset-2"
              >
                Vocabulary page
              </Link>{" "}
              and click <Badge variant="outline">Import</Badge>
            </li>
            <li>
              <span className="font-medium">Select</span> the target language
              from the dropdown
            </li>
            <li>
              <span className="font-medium">Upload</span> your CSV file
            </li>
            <li>
              <span className="font-medium">Click</span>{" "}
              <Badge variant="outline">Import</Badge> — matching items are
              updated, new items are created
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Downloads */}
      <Card>
        <CardHeader>
          <CardTitle>Templates & Docs</CardTitle>
          <CardDescription>
            Download sample data or documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              downloadBlob(
                generateSampleCsv(),
                "vocabulary-sample.csv",
                "text/csv;charset=utf-8;",
              )
            }
          >
            <Download className="size-4" />
            Sample CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadBlob(
                generateMarkdownDocs(),
                "import-format.md",
                "text/markdown;charset=utf-8;",
              )
            }
          >
            <FileText className="size-4" />
            Markdown Docs
          </Button>
        </CardContent>
      </Card>

      {/* CSV Columns */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
          <CardDescription>
            Columns in the CSV file and their meaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Required</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">type</TableCell>
                    <TableCell>
                      One of: noun, verb, adjective, adverb, pronoun, preposition, sentence, phrase
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">word</TableCell>
                    <TableCell>
                      The word/phrase in the target language
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">meaning</TableCell>
                    <TableCell>Translation in your language</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Optional</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">
                      example_sentence
                    </TableCell>
                    <TableCell>Example usage sentence</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">
                      category
                    </TableCell>
                    <TableCell>Topic category (see below)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">level</TableCell>
                    <TableCell>
                      elementary, intermediate, or advanced
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">
                      frequency_rank
                    </TableCell>
                    <TableCell>
                      Numeric rank (lower = more common)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">
                      note / notes
                    </TableCell>
                    <TableCell>Additional notes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">fields</TableCell>
                    <TableCell>
                      JSON string of type-specific fields (see below)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Fields */}
      {fieldDocs.map((group) => (
        <Card key={group.type}>
          <CardHeader>
            <CardTitle>
              <Badge variant="secondary" className="font-mono text-xs mr-2">
                {group.type}
              </Badge>
              {group.label} Fields
            </CardTitle>
            <CardDescription>
              Fields available in the <code className="text-xs">fields</code>{" "}
              JSON column for {group.label.toLowerCase()} type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.fields.map((f) => (
                  <TableRow key={f.field}>
                    <TableCell className="font-mono text-xs">
                      {f.field}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {f.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{f.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Available values for the{" "}
            <code className="text-xs">category</code> column
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {CATEGORIES.map((c) => (
              <div
                key={c.value}
                className="flex items-center gap-2 text-xs py-0.5"
              >
                <code className="text-[10px] bg-muted px-1 rounded">
                  {c.value}
                </code>
                <span className="text-muted-foreground">{c.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Levels</CardTitle>
          <CardDescription>
            Available values for the{" "}
            <code className="text-xs">level</code> column
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {LEVELS.map((l) => (
            <div key={l.value} className="flex items-center gap-2 text-sm">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {l.value}
              </code>
              <span className="text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
