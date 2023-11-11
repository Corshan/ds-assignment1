export type Review = {
    movieId: number,
    reviewerName: string,
    reviewDate: string,
    content: string,
    rating: number
}

export type UpdateReview = {
    content: string
}