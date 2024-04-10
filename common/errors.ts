export enum ErrorMessage {
    TwoAnswersMinimum = 'La question doit avoir au moins deux réponses.',
    FourAnswersMaximum = 'La question ne peut pas avoir plus de quatre réponses.',
    SimilarQuestionInBank = 'Une question similaire existe déjà dans la banque',
    QuizMustHaveQuestions = 'Le quiz doit avoir au moins une question',
    SimilarQuestionInQuiz = 'Une question similaire existe déjà dans le quiz',
    ConnexionError = 'Erreur de connexion au serveur',
    BadPassword = 'Mauvais mot de passe',
    EmptyName = 'Le nom ne peut pas être vide',
    OrganizorName = "Ce nom est réservé à l'organisateur de la partie",
    SystemName = 'Ce nom est réservé au système',
    AllPlayersHaveDisconnected = 'Tous les joueurs se sont déconnectés',
    LockedGame = 'La partie est verrouillée',
    InvalidCode = "Le code rentré n'est pas valide",
    CodeIsNotFourDigits = 'Le code doit être 4 chiffres',
    NoChoiceSelected = 'Vous devez choisir au moins un choix',
    JSONError = 'Erreur lors de la lecture du JSON',
    OrganizerLeft = 'Organisateur déconnecté',
    Banned = 'Organisateur vous a bannis',
    InvalidQuestion = 'Invalid question',
    InvalidQuestionType = "Ce type de question n'est pas supporté",
    DatabaseConnectionError = 'Database connection error',
    QuestionNotFound = 'Question not found',
    EmptyQuestionText = 'Le texte de la question ne peut pas être vide',
    NonValidChoiceAttributes = 'Attributs non attendus dans les choix de reponses:',
    MissingChoiceAttributes = 'Attributs manquants dans les choix de reponses:',
    InvalidChoiceType = 'Le choix doit etre un string, recu',
    InvalidIsCorrectType = 'isCorrect doit etre un boolean, recu',
    EmptyChoicesText = 'Le texte des choix doit être une chaîne de caractères non vide',
    LinkInChoicesText = "Le texte des choix ne peut pas contenir d'image, de vidéo ou de lien hypertexte",
    NoRightChoice = 'La question doit avoir au moins un bon choix',
    NoWrongChoice = 'La question doit avoir au moins un mauvais choix',
    WrongNumberOfChoices = 'La question doit avoir entre 2 et 4 choix',
    WrongPointsValue = 'Le nombre de points doit être entre 10 et 100 et être un multiple de 10',
    LinkInQuestionText = "Le texte de la question ne peut pas contenir d'image, de vidéo ou de lien hypertexte",
    NonValidQuestionAttributes = 'Attributs non attendus dans une question:',
    MissingQuestionAttributes = 'Attribut manquant dans une question:',
    InvalidPointsType = 'Le nombre de points doit être un nombre, reçu',
    QuizNotFound = 'Quiz not found',
    InvalidQuizDuration = "La duration doit etre etre 10 et 60 secondes ainsi qu'un multiple de 5",
    EmptyQuizTitle = 'Le titre ne peut pas être vide',
    SameQuizTitleExists = 'Un quiz avec ce titre existe déjà',
    MissingQuizAttributes = 'Attribut manquant dans un quiz:',
    InvalidQuizIdType = `L'ID du quiz doit être une chaîne de caractères, reçu`,
    InvalidQuizTitleType = `Le titre du quiz doit être une chaîne de caractères, reçu`,
    InvalidQuizDescriptionType = `La description du quiz doit être une chaîne de caractères, reçu`,
    InvalidQuizDurationType = `La durée du quiz doit être un nombre, reçu`,
    InvalidQuizQuestionsType = `Les questions du quiz doivent être un tableau, reçu`,
    InvalidQuizVisibilityType = `isVisible du quiz doit être un booléen, reçu`,
    LongAnswerWithChoices = 'Une questions à réponse longue ne peut pas avoir de choix',
    MutedByOrganizer = "L'organisateur vous a désactivé les droits de clavardage",
    UnmutedByOrganizer = "L'organisateur vous a reactivé les droits de clavardage",
}
