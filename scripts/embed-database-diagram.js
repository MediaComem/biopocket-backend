const chalk = require('chalk');
const fs = require('fs-extra');
const handlebars = require('handlebars');
const path = require('path');

const root = path.resolve(path.join(__dirname, '..'));

Promise
  .resolve()
  .then(embedDatabaseDiagram)
  .catch(err => console.warn(chalk.red(err.stack)));

/**
 * Reads the database diagram in `docs/database/diagram.xml`, embeds it in the
 * handlebars template in `docs/database/diagram.hbs`, and saves the result to
 * `docs/database/index.html`.
 *
 * The diagram can then be accessed from the main documentation page.
 *
 * The XML diagram can be edited with https://www.draw.io/
 */
async function embedDatabaseDiagram() {

  const diagramFile = path.join(root, 'docs', 'database', 'diagram.xml');
  const templateFile = path.join(root, 'docs', 'database', 'diagram.hbs');

  console.log(chalk.yellow(`Reading database diagram from ${path.relative(root, diagramFile)}...`));
  console.log(chalk.yellow(`Reading database diagram template from ${path.relative(root, templateFile)}...`));

  // Read the required files.
  const [ diagram, rawTemplate ] = await Promise.all([
    fs.readFile(diagramFile, 'utf8'),
    fs.readFile(templateFile, 'utf8')
  ]);

  // Compile the handlebars template.
  const template = handlebars.compile(rawTemplate);

  // Embed the database diagram into the template.
  const result = template({
    xml: JSON.stringify(diagram)
  });

  // Save the result as documentation.
  const docFile = path.join(root, 'docs', 'database', 'index.html');
  await fs.writeFile(docFile, result, 'utf8');

  console.log(chalk.green(`Embedded database diagram saved to ${path.relative(root, docFile)}`));
}
