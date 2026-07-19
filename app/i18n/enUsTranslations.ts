/** Canonical en-US copy. Seeded into the DB and served without a Neon round trip. */
export const EN_US_TRANSLATIONS: Record<string, string> = {
  // Game
  'game.title': 'Wordle',
  'game.navigation': 'Game controls',
  'game.loading': 'Loading',
  'game.playAgain': 'Play Again',
  'game.guessGrid': 'Guess grid',
  'game.status.correct': 'correct',
  'game.status.present': 'in wrong position',
  'game.status.absent': 'not in word',
  'game.status.empty': 'empty',
  'game.status.revealed': 'revealed answer',
  'game.lossReveal.the': 'THE',
  'game.lossReveal.word': 'WORD',
  'game.lossReveal.was': 'WAS',
  'game.gridCell.filled': 'Row {row}, Letter {col}: {letter}, {status}',
  'game.gridCell.empty': 'Row {row}, Letter {col}: empty',
  'game.errorBoundary.title': 'Something went wrong',
  'game.errorBoundary.description':
    'An unexpected error occurred. Please reload the page.',
  'game.errorBoundary.reload': 'Reload',
  'game.keyboard.region': 'On-screen keyboard',
  'game.keyboard.ariaBackspace': 'Backspace',
  'game.keyboard.ariaEnter': 'Enter',
  'game.keyboard.ariaKeyLetter': 'Key {letter}',
  'game.keyboard.ariaPlaceholder': 'Placeholder',

  // Game messages
  'message.notEnoughLetters': 'Not enough letters',
  'message.alreadyGuessed': 'You already guessed that word',
  'message.notValidWord': 'Not a valid word',
  'message.couldNotValidateWord':
    'Could not check that word. Check your connection and try again.',
  'message.retryValidationAria': 'Retry validating your guess',
  'message.gameOver': 'Game Over! The word was {solution}',
  'message.errorFetching': 'Error fetching word.',
  'message.hasPlaceholders': 'Replace placeholders with letters',
  'message.noValidWord': 'Could not find a valid word. Please try again later.',

  // Statistics
  'stats.title': 'Statistics',
  'stats.played': 'Played',
  'stats.won': 'Won',
  'stats.lost': 'Lost',
  'stats.winPercent': 'Win %',
  'stats.guessDistribution': 'Guess Distribution',
  'stats.signInToView': 'Sign in to view your stats.',
  'stats.reset': 'Reset Statistics',
  'stats.resetConfirm':
    'Are you sure you want to reset all your statistics? This cannot be undone.',
  'stats.resetCancel': 'Cancel',
  'stats.resetConfirmButton': 'Reset',
  'stats.recentWords': 'Recent Words',
  'stats.wonIn': 'Won in {guesses}',

  // Authentication
  'auth.signIn': 'Sign In To Wordle',
  'auth.signOut': 'Sign Out',
  'auth.signInWithGithub': 'Sign in with GitHub',
  'auth.signInWithGoogle': 'Sign in with Google',
  'auth.signInWithFacebook': 'Sign in with Facebook',
  'auth.lastUsed': 'Last used',
  'auth.or': 'or',
  'auth.username': 'Username',
  'auth.password': 'Password',

  // Theme
  'theme.lightMode': 'Light Mode',
  'theme.darkMode': 'Dark Mode',
  'theme.systemDefault': 'System Default',
  'theme.toggleTheme': 'toggle theme',
  'theme.switchToLight': 'Switch to light mode',
  'theme.switchToDark': 'Switch to dark mode',
  'theme.switchToSystem': 'Switch to system mode',

  // Dialog
  'dialog.close': 'Close dialog',
  'dialog.wordLoadError.title': 'Could not load a new word',
  'dialog.wordLoadError.description':
    'We could not reach the server to pick today’s word. Check your connection and try again. A previous round’s word is never reused so play stays fair.',
  'dialog.wordLoadError.tryAgain': 'Try again',

  // How to Play
  'howToPlay.title': 'How to Play',
  'howToPlay.tooltip': 'How to Play',
  'howToPlay.instruction': 'Guess the mystery 5 letter word!',
  'howToPlay.subInstruction':
    'After each guess, the letters will change colour to show how close you were to the correct word:',
  'howToPlay.legendAbsent': 'Grey - the letter is not in the word',
  'howToPlay.legendPresent':
    'Orange - the letter is in the word but in the wrong place',
  'howToPlay.legendCorrect': 'Green - the letter is correct',

  // Definition
  'definition.tooltip': 'Definition',
  'definition.close': 'Close definition',
  'definition.error': 'Could not load definition. Check your connection.',
  'definition.notFound': 'No definition found for this word.',
  'definition.retry': 'Try again',

  // Keyboard
  'keyboard.enter': 'ENTER',
  'keyboard.backspace': 'BACKSPACE',

  // Metadata
  'metadata.title': 'Wordle Clone',
  'metadata.description': 'A Wordle clone built with Next.js and MUI',

  // Build / about
  'build.versionLabel': 'Build',
};
