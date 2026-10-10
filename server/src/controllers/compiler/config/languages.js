const languages = {
  50: {
    id: 50,
    name: 'C',
    ext: 'c',
    cmd: 'gcc',
    compile: true,
    compileArgs: ['-o', 'OUTPUT', '-lm'],
    timeout: 10000,
    memoryLimit: '128m',
    runtimeCmd: './OUTPUT',
    runtimeArgs: []
  },
  54: {
    id: 54,
    name: 'C++',
    ext: 'cpp',
    cmd: 'g++',
    compile: true,
    compileArgs: ['-o', 'OUTPUT'],
    timeout: 10000,
    memoryLimit: '128m',
    runtimeCmd: './OUTPUT',
    runtimeArgs: []
  },
  62: {
    id: 62,
    name: 'Java',
    ext: 'java',
    cmd: 'javac',
    compile: true,
    compileArgs: ['OUTPUT.java'],
    timeout: 10000000,
    memoryLimit: '128m',
    runtimeCmd: 'java',
    runtimeArgs: ['OUTPUT']
  },
  63: {
    id: 63,
    name: 'JavaScript',
    ext: 'js',
    cmd: 'node',
    compile: false,
    timeout: 10000,
    memoryLimit: '128m',
    runtimeCmd: 'node',
    runtimeArgs: []
  },
  71: {
    id: 71,
    name: 'Python',
    ext: 'py',
    cmd: 'python3',
    compile: false,
    timeout: 10000,
    memoryLimit: '128m',
    runtimeCmd: 'python3',
    runtimeArgs: ['-u']
  },
  74: {
    id: 74,
    name: 'TypeScript',
    ext: 'ts',
    cmd: 'ts-node',
    compile: false,
    timeout: 15000,
    memoryLimit: '128m',
    runtimeCmd: 'ts-node',
    runtimeArgs: []
  },
  80: {
    id: 80,
    name: 'R',
    ext: 'r',
    cmd: 'Rscript',
    compile: false,
    timeout: 10000,
    memoryLimit: '256m',
    runtimeCmd: 'Rscript',
    runtimeArgs: []
  }
};

const languageMap = {
  50: 'c',
  54: 'cpp',
  62: 'java',
  63: 'javascript',
  71: 'python',
  74: 'typescript',
  80: 'r'
};

module.exports = { languages, languageMap };
