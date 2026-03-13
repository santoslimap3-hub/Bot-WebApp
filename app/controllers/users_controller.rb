class UsersController < ApplicationController
    def create
        user = User.create(user_params)
        redirect_to "/dashboard"
    end

    def user_params
        params.permit(:email, :password, :password_confirmation)
    end
end