const { parse, BaseJavaCstVisitorWithDefaults } = require('java-parser');

// Visitor class to extract class names from CST
class ClassNameExtractor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
    super();
    this.className = null;
    this.validateVisitor();
  }

  classDeclaration(ctx) {
    // Handle regular classes
    if (ctx.normalClassDeclaration && ctx.normalClassDeclaration[0]) {
      const ncd = ctx.normalClassDeclaration[0];
      if (ncd.children.typeIdentifier && ncd.children.typeIdentifier[0]) {
        const ti = ncd.children.typeIdentifier[0];
        if (ti.children.Identifier && ti.children.Identifier[0]) {
          this.className = ti.children.Identifier[0].image;
        }
      }
    }
    
    // Handle enums (which are nested in class declarations)
    if (ctx.enumDeclaration && ctx.enumDeclaration[0]) {
      const ed = ctx.enumDeclaration[0];
      if (ed.children.typeIdentifier && ed.children.typeIdentifier[0]) {
        const ti = ed.children.typeIdentifier[0];
        if (ti.children.Identifier && ti.children.Identifier[0]) {
          this.className = ti.children.Identifier[0].image;
        }
      }
    }
  }

  // Handle the CST structure properly
  ordinaryCompilationUnit(ctx) {
    if (ctx.typeDeclaration) {
      ctx.typeDeclaration.forEach(typeDecl => {
        this.visit(typeDecl);
      });
    }
  }

  interfaceDeclaration(ctx) {
    if (ctx.normalInterfaceDeclaration && ctx.normalInterfaceDeclaration[0]) {
      const nid = ctx.normalInterfaceDeclaration[0];
      if (nid.children.typeIdentifier && nid.children.typeIdentifier[0]) {
        const ti = nid.children.typeIdentifier[0];
        if (ti.children.Identifier && ti.children.Identifier[0]) {
          this.className = ti.children.Identifier[0].image;
        }
      }
    }
  }

  enumDeclaration(ctx) {
    if (ctx.typeIdentifier && ctx.typeIdentifier[0]) {
      const ti = ctx.typeIdentifier[0];
      if (ti.children.Identifier && ti.children.Identifier[0]) {
        this.className = ti.children.Identifier[0].image;
      }
    }
  }

  annotationTypeDeclaration(ctx) {
    if (ctx.Identifier && ctx.Identifier[0]) {
      this.className = ctx.Identifier[0].image;
    }
  }
}

/**
 * Extracts the class name from Java source code
 * @param {string} javaCode - The Java source code
 * @returns {string} The class name found in the code
 * @throws {Error} If no class is found or parsing fails
 */
function extractClassName(javaCode) {
    try {
        const cst = parse(javaCode);
        const extractor = new ClassNameExtractor();
        extractor.visit(cst);
        
        if (!extractor.className) {
            throw new Error('No class declaration found in the Java code');
        }
        
        return extractor.className;
    } catch (error) {
        throw new Error(`Failed to parse Java code: ${error.message}`);
    }
}

/**
 * Validates that the Java code contains a class declaration
 * @param {string} javaCode - The Java source code
 * @returns {boolean} True if the code contains a class declaration
 */
function hasClassDeclaration(javaCode) {
    try {
        const className = extractClassName(javaCode);
        return !!className;
    } catch {
        return false;
    }
}

module.exports = {
    extractClassName,
    hasClassDeclaration
};
